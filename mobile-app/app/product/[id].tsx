import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  addToCart,
  getProductById,
  createProductOrder,
  getCart,
} from "../../services/api";
import { Product } from "../../types/api";
import { useApiUser } from "../../contexts/ApiUserContext";
import Toast from "react-native-toast-message";
import ImageCarousel from "../../components/ImageCarousel";

const STATIC_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUserId, apiUser } = useApiUser();
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProductById(id!);
      setItem(res.product);

      // Check if product is already in cart
      if (apiUser?._id) {
        const cartRes = await getCart(apiUser._id);
        const isProductInCart = cartRes.cart?.items?.some(
          (item) => item.productId === id
        );
        setIsInCart(isProductInCart || false);
      }
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load product details",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const add = async () => {
    if (!apiUser?._id || !item) return;

    if (item.stock && item.stock <= 0) {
      Toast.show({
        type: "error",
        text1: "Out of Stock",
        text2: "This product is currently out of stock",
      });
      return;
    }

    if (isInCart) {
      Toast.show({
        type: "info",
        text1: "Already in Cart",
        text2: "This product is already in your cart",
      });
      return;
    }

    setAdding(true);
    try {
      await addToCart({
        userId: apiUser._id,
        productId: item._id,
        quantity: 1,
      });
      setIsInCart(true);
      Toast.show({
        type: "success",
        text1: "Added to Cart",
        text2: "Product added to your cart successfully",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e?.message || "Failed to add to cart",
      });
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    if (!firebaseUserId || !item) return;

    if (item.stock && item.stock <= 0) {
      Toast.show({
        type: "error",
        text1: "Out of Stock",
        text2: "This product is currently out of stock",
      });
      return;
    }

    setShowAddressForm(true);
  };

  const confirmPurchase = async () => {
    if (!firebaseUserId || !item) return;

    // Validate shipping address
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      Toast.show({
        type: "error",
        text1: "Incomplete Address",
        text2: "Please fill in all address fields",
      });
      return;
    }

    setBuying(true);
    try {
      await createProductOrder({
        productId: item._id,
        sellerId: item.createdBy, // Use MongoDB ObjectId for seller
        buyerId: apiUser!._id, // Use MongoDB ObjectId for buyer
        quantity: 1,
        shippingAddress,
        notes: "Purchase from mobile app",
      });

      setShowAddressForm(false);
      Toast.show({
        type: "success",
        text1: "Order Placed!",
        text2: "Your order has been placed successfully",
      });

      // Refresh product details to get updated stock
      await load();

      // Navigate to purchases screen
      setTimeout(() => {
        router.push("/(tabs)/purchases");
      }, 1500);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Purchase Failed",
        text2: e?.message || "Failed to complete purchase",
      });
    } finally {
      setBuying(false);
    }
  };

  const isOutOfStock = !item?.stock || item.stock <= 0;
  const isOwnProduct = item?.createdByFId === firebaseUserId;

  if (loading || !item)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );

  if (showAddressForm) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shipping Address</Text>
          <Text style={styles.headerSubtitle}>Enter your delivery address</Text>
        </View>

        <View style={styles.addressForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={shippingAddress.street}
              onChangeText={(text) =>
                setShippingAddress((prev) => ({ ...prev, street: text }))
              }
              placeholder="Enter street address"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.city}
                onChangeText={(text) =>
                  setShippingAddress((prev) => ({ ...prev, city: text }))
                }
                placeholder="City"
              />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.state}
                onChangeText={(text) =>
                  setShippingAddress((prev) => ({ ...prev, state: text }))
                }
                placeholder="State"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.zipCode}
                onChangeText={(text) =>
                  setShippingAddress((prev) => ({ ...prev, zipCode: text }))
                }
                placeholder="ZIP Code"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Country *</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.country}
                onChangeText={(text) =>
                  setShippingAddress((prev) => ({ ...prev, country: text }))
                }
                placeholder="Country"
              />
            </View>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product:</Text>
              <Text style={styles.summaryValue}>{item.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryValue}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity:</Text>
              <Text style={styles.summaryValue}>1</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${item.price.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAddressForm(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, buying && styles.confirmBtnDisabled]}
              onPress={confirmPurchase}
              disabled={buying}
            >
              {buying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Product Images */}
      <View style={styles.imageContainer}>
        <ImageCarousel
          images={
            item.images && item.images.length > 0
              ? item.images
              : item.image
              ? [{ url: item.image, publicId: "", alt: "Product image" }]
              : []
          }
          height={300}
          borderRadius={0}
          showPagination={true}
        />
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.productDetails}>
        <View style={styles.productHeader}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        </View>

        {/* Stock Info */}
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>
            {isOutOfStock ? "Out of Stock" : `${item.stock} in stock`}
          </Text>
          {item.totalSold && (
            <Text style={styles.soldInfo}>{item.totalSold} sold</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <Text style={styles.sellerInfo}>
            Seller ID: {item.createdBy || "Unknown"}
          </Text>
          {item.createdAt && (
            <Text style={styles.listedDate}>
              Listed on: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {!isOwnProduct && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                (adding || isOutOfStock || isInCart) && styles.disabledBtn,
              ]}
              onPress={add}
              disabled={adding || isOutOfStock || isInCart}
            >
              <Text style={styles.addToCartBtnText}>
                {adding ? "Adding..." : isInCart ? "In Cart" : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buyNowBtn,
                (buying || isOutOfStock) && styles.disabledBtn,
              ]}
              onPress={buyNow}
              disabled={buying || isOutOfStock}
            >
              <Text style={styles.buyNowBtnText}>
                {buying ? "Processing..." : "Buy Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isOwnProduct && (
          <View style={styles.ownProductNotice}>
            <Text style={styles.ownProductText}>This is your own product</Text>
          </View>
        )}
      </View>
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
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  imageContainer: {
    position: "relative",
    height: 300,
    backgroundColor: "#fff",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  productDetails: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  productHeader: {
    marginBottom: 20,
  },
  category: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  stockInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 20,
  },
  stockLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  soldInfo: {
    fontSize: 14,
    color: "#666",
  },
  descriptionSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  sellerSection: {
    marginBottom: 30,
  },
  sellerInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  listedDate: {
    fontSize: 14,
    color: "#666",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 15,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartBtnText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  ownProductNotice: {
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  ownProductText: {
    color: "#F57C00",
    fontSize: 16,
    fontWeight: "600",
  },
  // Address Form Styles
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
  addressForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 5,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  orderSummary: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#cccccc",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
