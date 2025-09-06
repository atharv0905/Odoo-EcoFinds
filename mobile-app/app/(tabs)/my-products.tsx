import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  deleteProductByFirebaseId,
  getProductsByFirebaseId,
} from "../../services/api";
import { Product } from "../../types/api";
import { useApiUser } from "../../contexts/ApiUserContext";
import { Link, router } from "expo-router";
import ImageCarousel from "../../components/ImageCarousel";

const STATIC_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80";

export default function MyProductsScreen() {
  const { firebaseUserId } = useApiUser();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!firebaseUserId) return;
    setLoading(true);
    try {
      console.log("Loading products for Firebase user:", firebaseUserId); // Debug log
      const res = await getProductsByFirebaseId(firebaseUserId);
      console.log("My Products API Response:", res); // Debug log
      setItems(
        res.products.map((p) => ({ ...p, image: p.image || STATIC_IMAGE }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [firebaseUserId]);

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProductByFirebaseId(id, firebaseUserId!);
            load();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const productImages =
      item.images && item.images.length > 0
        ? item.images
        : item.image
        ? [{ url: item.image, publicId: "", alt: "Product image" }]
        : [];

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <ImageCarousel
            images={productImages}
            height={140}
            borderRadius={8}
            showPagination={productImages.length > 1}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc} numberOfLines={1}>
            {item.category}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() =>
                  router.push({
                    pathname: "/product/edit/[id]",
                    params: { id: item._id },
                  } as any)
                }
              >
                <Text style={styles.btnGhostText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={() => confirmDelete(item._id)}
              >
                <Text style={styles.btnDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.ordersBtn}
          onPress={() => router.push("/product-orders")}
        >
          <Text style={styles.ordersBtnText}>📋 Orders</Text>
        </TouchableOpacity>

        <Link href={"/product/new" as any} asChild>
          <TouchableOpacity style={styles.primary}>
            <Text style={styles.primaryText}>+ New Product</Text>
          </TouchableOpacity>
        </Link>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ordersBtn: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ordersBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  primary: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  imageContainer: {
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  image: { height: 120, backgroundColor: "#e8f5e9" },
  cardContent: { padding: 12, gap: 6 },
  title: { fontSize: 16, fontWeight: "700", color: "#222" },
  desc: { color: "#555" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontWeight: "800", color: "#2E7D32" },
  btnGhost: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#999",
  },
  btnGhostText: { color: "#333", fontWeight: "600" },
  btnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#ff6b6b",
  },
  btnDangerText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
