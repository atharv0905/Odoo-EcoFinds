import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { addPurchase, getCart, removeFromCart } from "../../services/api";
import { Cart } from "../../types/api";
import { useApiUser } from "../../contexts/ApiUserContext";
import { useIsFocused } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import ImageCarousel from "../../components/ImageCarousel";

export default function CartScreen() {
  const { firebaseUserId, apiUser } = useApiUser();
  const isFocused = useIsFocused();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!apiUser?._id) return;
    setLoading(true);
    try {
      const res = await getCart(apiUser._id);
      setCart(res.cart);
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

  useEffect(() => {
    if (isFocused && apiUser?._id) {
      load();
    }
  }, [apiUser?._id, isFocused]);

  useEffect(() => {
    loadCartItemDetails();
  }, [cart]);

  const totalItems = useMemo(
    () => cart?.items.reduce((s, i) => s + i.quantity, 0) || 0,
    [cart]
  );

  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<any[]>([]);

  const loadCartItemDetails = async () => {
    if (!cart?.items?.length) {
      setCartItemsWithDetails([]);
      return;
    }

    try {
      const { getProductById } = await import("../../services/api");
      const itemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const res = await getProductById(item.productId);
            return {
              ...item,
              product: res.product,
            };
          } catch (e) {
            console.error(`Failed to fetch product ${item.productId}:`, e);
            return {
              ...item,
              product: null,
            };
          }
        })
      );
      setCartItemsWithDetails(itemsWithDetails);
    } catch (e) {
      console.error("Failed to load cart item details:", e);
    }
  };

  const subtotal = useMemo(() => {
    return cartItemsWithDetails.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0);
  }, [cartItemsWithDetails]);

  const removeItem = async (productId: string) => {
    if (!apiUser?._id) return;
    try {
      await removeFromCart(apiUser._id, productId);
      await load();
      Toast.show({
        type: "success",
        text1: "Item Removed",
        text2: "Product removed from cart",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e?.message || "Failed to remove item",
      });
    }
  };

  const checkout = async () => {
    if (!apiUser?._id || !cartItemsWithDetails.length) return;

    Alert.alert(
      "Confirm Checkout",
      `Proceed with checkout for ${totalItems} items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Checkout",
          onPress: async () => {
            setSaving(true);
            try {
              const { createProductOrder } = await import("../../services/api");

              // Create individual orders for each product
              const orderPromises = cartItemsWithDetails.map(async (item) => {
                if (!item.product) return;

                return createProductOrder({
                  productId: item.productId,
                  sellerId: item.product.createdBy,
                  buyerId: apiUser._id,
                  quantity: item.quantity,
                  shippingAddress: {
                    street: "Default Address",
                    city: "City",
                    state: "State",
                    zipCode: "12345",
                    country: "India",
                  },
                  notes: "Order from mobile app cart",
                });
              });

              await Promise.all(orderPromises);

              // Clear cart by removing all items
              const removePromises =
                cart?.items.map((item) =>
                  removeFromCart(apiUser._id, item.productId)
                ) || [];
              await Promise.all(removePromises);

              // Refresh cart
              await load();

              Toast.show({
                type: "success",
                text1: "Orders Placed!",
                text2: "Your eco-friendly purchases are confirmed! 🌱",
              });
            } catch (e: any) {
              Toast.show({
                type: "error",
                text1: "Checkout Failed",
                text2: e?.message || "Failed to complete checkout",
              });
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const clearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          if (!cart?.items.length) return;
          for (const item of cart.items) {
            await removeItem(item.productId);
          }
        },
      },
    ]);
  };

  const renderCartItem = ({ item }: { item: any }) => {
    if (!item.product) {
      return (
        <View style={styles.cartItem}>
          <View style={styles.productImagePlaceholder} />
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>Loading...</Text>
          </View>
        </View>
      );
    }

    const productDetails = item.product;
    const isOutOfStock = !productDetails.stock || productDetails.stock <= 0;

    return (
      <View style={styles.cartItem}>
        <Image
          source={{
            uri:
              productDetails.image ||
              "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
          }}
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{productDetails.title}</Text>
          <Text style={styles.productCategory}>{productDetails.category}</Text>
          <Text style={styles.productPrice}>
            ${productDetails.price?.toFixed(2)}
          </Text>
          {isOutOfStock && (
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeItem(item.productId)}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEcoImpact = () => (
    <View style={styles.ecoImpactCard}>
      <View style={styles.ecoHeader}>
        <Text style={styles.ecoIcon}>🌱</Text>
        <Text style={styles.ecoTitle}>Eco Impact</Text>
      </View>
      <Text style={styles.ecoDescription}>
        By choosing these products, you're helping reduce carbon footprint and
        supporting sustainable practices!
      </Text>
      <View style={styles.ecoStats}>
        <View style={styles.ecoStat}>
          <Text style={styles.ecoStatValue}>2.5kg</Text>
          <Text style={styles.ecoStatLabel}>CO2 Saved</Text>
        </View>
        <View style={styles.ecoStat}>
          <Text style={styles.ecoStatValue}>+{totalItems * 10}</Text>
          <Text style={styles.ecoStatLabel}>Eco Points</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  if (!cart?.items.length) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 Your Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>
            Review your eco-friendly selections
          </Text>
        </View>

        {/* Empty Cart */}
        <View style={styles.emptyCart}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Discover amazing eco-friendly products and add them to your cart!
          </Text>
          <TouchableOpacity style={styles.browseBtin}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Your Shopping Cart</Text>
        <Text style={styles.headerSubtitle}>
          Review your eco-friendly selections
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Items in Your Cart</Text>
            <Text style={styles.itemCount}>{totalItems} items</Text>
          </View>

          <FlatList
            data={cartItemsWithDetails}
            keyExtractor={(item) => item.productId}
            renderItem={renderCartItem}
            scrollEnabled={false}
            contentContainerStyle={styles.cartList}
          />
        </View>

        {/* Eco Impact */}
        {renderEcoImpact()}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Eco Impact Bonus:</Text>
            <Text style={styles.ecoBonus}>+{totalItems * 10} points</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.checkoutBtn, saving && styles.checkoutBtnDisabled]}
              onPress={checkout}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <Text style={styles.clearBtnText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  emptyCart: {
    alignItems: "center",
    padding: 60,
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
  browseBtin: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  browseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cartSection: {
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
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cartList: {
    gap: 15,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 12,
    color: "#4CAF50",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  quantityContainer: {
    alignItems: "flex-end",
  },
  quantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  removeBtn: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ecoImpactCard: {
    backgroundColor: "#E8F5E9",
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  ecoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ecoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  ecoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  ecoDescription: {
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
    marginBottom: 15,
  },
  ecoStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ecoStat: {
    alignItems: "center",
  },
  ecoStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  ecoStatLabel: {
    fontSize: 12,
    color: "#2E7D32",
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
  },
  ecoBonus: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    marginTop: 25,
    gap: 15,
  },
  checkoutBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutBtnDisabled: {
    backgroundColor: "#cccccc",
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearBtn: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  outOfStockText: {
    fontSize: 12,
    color: "#dc3545",
    fontWeight: "600",
    marginTop: 5,
  },
});
