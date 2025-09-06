import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApiUser } from "../../contexts/ApiUserContext";
import { getBuyerOrders } from "../../services/api";
import { ProductOrder } from "../../types/api";

const STATIC_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80";

export default function PurchasesScreen() {
  const { apiUserId, loading: userLoading } = useApiUser();
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortFilter, setSortFilter] = useState<"newest" | "oldest">("newest");

  const load = async () => {
    if (!apiUserId) return;
    setLoading(true);
    try {
      const res = await getBuyerOrders(apiUserId);
      setOrders(res.orders || []);
      setTotalProducts(res.orders?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!userLoading && apiUserId) {
        load();
      }
    }, [userLoading, apiUserId])
  );

  const getSortedOrders = () => {
    const sorted = [...orders];
    if (sortFilter === "newest") {
      return sorted.sort(
        (a, b) =>
          new Date(b.orderDate || 0).getTime() -
          new Date(a.orderDate || 0).getTime()
      );
    } else {
      return sorted.sort(
        (a, b) =>
          new Date(a.orderDate || 0).getTime() -
          new Date(b.orderDate || 0).getTime()
      );
    }
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

  const calculateTotalSpent = () => {
    return orders.reduce((total, order) => total + order.totalPrice, 0);
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

  const renderItem = ({ item }: { item: ProductOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>Order #{item._id.slice(-6)}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.orderDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.orderStatus}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text
          style={[styles.statusValue, { color: getStatusColor(item.status) }]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>
          {typeof item.productId === "object"
            ? item.productId.title
            : `Product ${item.productId.slice(-6)}`}
        </Text>
        <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.productPrice}>
          Price: ${item.totalPrice.toFixed(2)}
        </Text>
      </View>

      {item.shippingAddress && (
        <View style={styles.addressInfo}>
          <Text style={styles.addressLabel}>Shipping to:</Text>
          <Text style={styles.addressText}>
            {item.shippingAddress.street}, {item.shippingAddress.city}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEcoImpact = () => (
    <View style={styles.ecoImpactSection}>
      <Text style={styles.sectionTitle}>🌍 Your Environmental Impact</Text>
      <View style={styles.impactGrid}>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>🌱</Text>
          <Text style={styles.impactValue}>45 kg</Text>
          <Text style={styles.impactLabel}>CO2 Saved</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>💧</Text>
          <Text style={styles.impactValue}>180 L</Text>
          <Text style={styles.impactLabel}>Water Saved</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>🗑️</Text>
          <Text style={styles.impactValue}>1.2 kg</Text>
          <Text style={styles.impactLabel}>Waste Prevented</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>🏆</Text>
          <Text style={styles.impactValue}>Eco Warrior</Text>
          <Text style={styles.impactLabel}>Your Rank</Text>
        </View>
      </View>
      <Text style={styles.impactMessage}>
        Thank you for choosing eco-friendly products! Your purchases are making
        a positive impact on our planet. 🌍💚
      </Text>
    </View>
  );

  if (userLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your purchase history...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Purchase History</Text>
        <Text style={styles.headerSubtitle}>
          Track your eco-friendly purchases and impact
        </Text>
      </View>

      {/* Purchase Stats */}
      <View style={styles.statsContainer}>
        {renderStatCard("🛒", orders.length, "Total Orders")}
        {renderStatCard(
          "📦",
          orders.reduce((sum, order) => sum + order.quantity, 0),
          "Products Bought"
        )}
        {renderStatCard("🌱", orders.length * 10, "Eco Points Earned")}
        {renderStatCard(
          "💰",
          `$${calculateTotalSpent().toFixed(2)}`,
          "Total Spent"
        )}
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No purchases yet</Text>
          <Text style={styles.emptyText}>
            Start shopping for eco-friendly products to see your purchase
            history here!
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Sort Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Your Orders</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  sortFilter === "newest" && styles.filterBtnActive,
                ]}
                onPress={() => setSortFilter("newest")}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    sortFilter === "newest" && styles.filterBtnTextActive,
                  ]}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  sortFilter === "oldest" && styles.filterBtnActive,
                ]}
                onPress={() => setSortFilter("oldest")}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    sortFilter === "oldest" && styles.filterBtnTextActive,
                  ]}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Orders List */}
          <View style={styles.purchasesList}>
            {getSortedOrders().map((item) => (
              <View key={item._id}>{renderItem({ item })}</View>
            ))}
          </View>

          {/* Eco Impact Section */}
          {renderEcoImpact()}
        </>
      )}
    </ScrollView>
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
    padding: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterButtons: {
    flexDirection: "row",
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginLeft: 10,
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
  purchasesList: {
    paddingHorizontal: 20,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  productCount: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 15,
  },
  productsContainer: {
    gap: 10,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 48,
    height: 48,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: "#666",
  },
  moreProducts: {
    fontSize: 12,
    color: "#4CAF50",
    fontStyle: "italic",
    marginTop: 5,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  addressInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addressLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
  },
  ecoImpactSection: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  impactItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 20,
  },
  impactIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  impactLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  impactMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
  },
});
