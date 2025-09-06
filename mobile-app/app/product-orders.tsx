import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useApiUser } from "../contexts/ApiUserContext";
import {
  getSellerOrders,
  updateOrderStatus,
  getSellerStats,
} from "../services/api";
import { ProductOrder } from "../types/api";
import Toast from "react-native-toast-message";
import { router } from "expo-router";

export default function ProductOrdersScreen() {
  const { firebaseUserId, apiUser } = useApiUser();
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
  });

  const load = async () => {
    if (!firebaseUserId || !apiUser?._id) return;
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        getSellerOrders(
          firebaseUserId, // Use Firebase ID for seller orders
          statusFilter === "all" ? undefined : statusFilter
        ),
        getSellerStats(firebaseUserId), // Use Firebase ID for seller stats
      ]);

      setOrders(ordersRes.orders || []);
      setStats({
        totalOrders: statsRes.stats?.totalOrders || 0,
        totalRevenue: statsRes.stats?.totalRevenue || 0,
        pendingOrders: statsRes.stats?.statusBreakdown?.pending || 0,
        averageOrderValue: statsRes.stats?.averageOrderValue || 0,
      });
    } catch (e) {
      console.error("Failed to load orders:", e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load orders",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [firebaseUserId, statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!firebaseUserId) return;

    Alert.alert(
      "Update Order Status",
      `Change order status to ${newStatus.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, newStatus, firebaseUserId);
              await load(); // Refresh orders
              Toast.show({
                type: "success",
                text1: "Status Updated",
                text2: `Order status changed to ${newStatus}`,
              });
            } catch (e: any) {
              Toast.show({
                type: "error",
                text1: "Update Failed",
                text2: e?.message || "Failed to update order status",
              });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ffc107";
      case "confirmed":
        return "#17a2b8";
      case "shipped":
        return "#6f42c1";
      case "delivered":
        return "#28a745";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "shipped";
      case "shipped":
        return "delivered";
      default:
        return null;
    }
  };

  const renderStatCard = (
    icon: string,
    value: string | number,
    label: string
  ) => (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: ProductOrder }) => {
    const nextStatus = getNextStatus(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{item._id.slice(-6)}</Text>
          <Text
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.productTitle}>
            {typeof item.productId === "object"
              ? item.productId.title
              : `Product ${item.productId.slice(-6)}`}
          </Text>
          <Text style={styles.orderInfo}>Quantity: {item.quantity}</Text>
          <Text style={styles.orderInfo}>
            Total: ${item.totalPrice.toFixed(2)}
          </Text>
          <Text style={styles.orderDate}>
            Ordered: {new Date(item.orderDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.buyerInfo}>
          <Text style={styles.buyerLabel}>Buyer:</Text>
          <Text style={styles.buyerText}>{item.buyerId}</Text>
        </View>

        {item.shippingAddress && (
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingLabel}>Shipping Address:</Text>
            <Text style={styles.shippingText}>
              {item.shippingAddress.street}, {item.shippingAddress.city},{" "}
              {item.shippingAddress.state} {item.shippingAddress.zipCode}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesInfo}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {nextStatus &&
          item.status !== "delivered" &&
          item.status !== "cancelled" && (
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={() => updateStatus(item._id, nextStatus)}
            >
              <Text style={styles.updateBtnText}>
                Mark as{" "}
                {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Product Orders</Text>
        <Text style={styles.headerSubtitle}>
          Manage orders for your eco-friendly products
        </Text>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsContainer}>
        {renderStatCard("📋", stats.totalOrders, "Total Orders")}
        {renderStatCard("⏳", stats.pendingOrders, "Pending Orders")}
        {renderStatCard(
          "💰",
          `$${stats.totalRevenue.toFixed(2)}`,
          "Total Revenue"
        )}
        {renderStatCard(
          "📈",
          `$${stats.averageOrderValue.toFixed(2)}`,
          "Avg Order Value"
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterButtons}>
          {["all", "pending", "confirmed", "shipped", "delivered"].map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterBtn,
                  statusFilter === status && styles.filterBtnActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    statusFilter === status && styles.filterBtnTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              When customers purchase your products, their orders will appear
              here for you to manage.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    marginBottom: 10,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8F5E9",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterBtnActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterBtnText: {
    fontSize: 12,
    color: "#666",
  },
  filterBtnTextActive: {
    color: "#fff",
  },
  ordersList: {
    padding: 20,
    paddingTop: 10,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  orderDetails: {
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  orderInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  buyerInfo: {
    flexDirection: "row",
    marginBottom: 15,
  },
  buyerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  buyerText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  shippingInfo: {
    marginBottom: 15,
  },
  shippingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  shippingText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  notesInfo: {
    marginBottom: 15,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  updateBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
