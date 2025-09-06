import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useApiUser } from "../../contexts/ApiUserContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllProducts,
  smartSearchProducts,
  filterProductsByCategory,
  getCart,
  getPurchases,
} from "../../services/api";
import { Product } from "../../types/api";
import Toast from "react-native-toast-message";
import ImageCarousel from "../../components/ImageCarousel";

const STATIC_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80";

const CATEGORIES = [
  "All Products",
  "Kitchen",
  "Personal Care",
  "Electronics",
  "Home & Garden",
  "Fashion",
];

export default function DashboardScreen() {
  const { firebaseUserId, apiUser, loading: userLoading } = useApiUser();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All Products");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    cartItems: 0,
    userPoints: 0,
    purchaseCount: 0,
  });

  const loadStats = async () => {
    if (!firebaseUserId || !apiUser?._id) return;
    try {
      const [cartRes, purchasesRes] = await Promise.all([
        getCart(apiUser._id), // Use MongoDB ID for cart operations
        getPurchases(apiUser._id), // Use MongoDB ID for purchase operations
      ]);
      setStats({
        totalProducts: products.length,
        cartItems: cartRes.totalItems || 0,
        userPoints: apiUser.gamification?.points || 0,
        purchaseCount: purchasesRes.count || 0,
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const load = async (reset = true) => {
    setLoading(true);
    try {
      const res = await getAllProducts(reset ? 1 : page, 12);
      console.log("API Response:", res); // Debug log
      console.log("Current Firebase user ID:", firebaseUserId); // Debug current user

      let allProducts = res.products || [];

      // Filter out user's own products and add fallback image
      const filteredProducts = allProducts
        .filter(
          (p) => p.createdByFId !== firebaseUserId && p.isActive !== false
        )
        .map((p) => ({
          ...p,
          image: p.image || STATIC_IMAGE,
        }));

      if (reset) {
        setProducts(filteredProducts);
        setPage(2);
      } else {
        setProducts((prev) => [...prev, ...filteredProducts]);
        setPage((prev) => prev + 1);
      }
      setHasMore(filteredProducts.length >= 12);

      // Update total products count for stats
      setStats((prev) => ({
        ...prev,
        totalProducts: res.count || filteredProducts.length,
      }));
    } catch (e) {
      console.error("Load products error:", e);
      Toast.show({
        type: "error",
        text1: "Error loading products",
        text2: e instanceof Error ? e.message : "Failed to load products",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return load(true);
    setLoading(true);
    try {
      const res = await smartSearchProducts(search, 1, 20);
      const filteredProducts = res.results
        .filter((p) => p.createdByFId !== firebaseUserId)
        .map((p) => ({
          ...p,
          image: p.image || STATIC_IMAGE,
        }));
      setProducts(filteredProducts);
      setHasMore(false);
      setPage(1);
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: e instanceof Error ? e.message : "Failed to search products",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    if (category === "All Products") return load(true);
    setLoading(true);
    try {
      const res = await filterProductsByCategory(category);
      const filteredProducts = res.products
        .filter((p) => p.createdByFId !== firebaseUserId)
        .map((p) => ({
          ...p,
          image: p.image || STATIC_IMAGE,
        }));
      setProducts(filteredProducts);
      setHasMore(false);
      setPage(1);
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: "Filter failed",
        text2: e instanceof Error ? e.message : "Failed to filter products",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      load(true);
      loadStats();
    }
  }, [userLoading, firebaseUserId]);

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

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryBtn,
        selectedCategory === category && styles.categoryBtnActive,
      ]}
      onPress={() => handleCategoryFilter(category)}
    >
      <Text
        style={[
          styles.categoryBtnText,
          selectedCategory === category && styles.categoryBtnTextActive,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    // Use new images array or fallback to legacy image field
    const productImages =
      item.images && item.images.length > 0
        ? item.images
        : item.image
        ? [{ url: item.image, publicId: "", alt: "Product image" }]
        : [];

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          router.push({
            pathname: "/product/[id]",
            params: { id: item._id },
          } as any)
        }
      >
        <View style={styles.productImageContainer}>
          <ImageCarousel
            images={productImages}
            height={120}
            borderRadius={8}
            showPagination={productImages.length > 1}
          />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>${item.price?.toFixed(2)}</Text>
          {item.stock !== undefined && (
            <Text style={styles.productStock}>
              {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (userLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading EcoFinds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([load(true), loadStats()]);
              setRefreshing(false);
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Eco-Friendly Products</Text>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.displayName || user?.email}! 🌱
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard("🛍️", stats.totalProducts, "Available Products")}
          {renderStatCard("🛒", stats.cartItems, "Cart Items")}
          {renderStatCard("🏆", stats.userPoints, "Eco Points")}
          {renderStatCard("📦", stats.purchaseCount, "Purchases")}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search eco-friendly products..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All Products"
              ? "All Products"
              : selectedCategory}
          </Text>

          {loading && products.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or browse all categories.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => handleCategoryFilter("All Products")}
              >
                <Text style={styles.emptyBtnText}>Show All Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              renderItem={renderProduct}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (
                  hasMore &&
                  !loading &&
                  selectedCategory === "All Products" &&
                  !search
                ) {
                  load(false);
                }
              }}
              ListFooterComponent={
                hasMore && selectedCategory === "All Products" && !search ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator color="#4CAF50" />
                  </View>
                ) : null
              }
            />
          )}
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
  welcomeText: {
    fontSize: 16,
    color: "#E8F5E9",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: {
    fontSize: 18,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 0,
  },
  categoryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryBtnActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  categoryBtnText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryBtnTextActive: {
    color: "#fff",
  },
  productsSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  productRow: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  productInfo: {
    alignItems: "flex-start",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    color: "#4CAF50",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  productStock: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
