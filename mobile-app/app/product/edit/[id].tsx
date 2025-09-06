import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getProductById, updateProduct } from "../../../services/api";
import { Product } from "../../../types/api";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProductById(id!);
      setItem(res.product);
      setTitle(res.product.title);
      setDescription(res.product.description);
      setCategory(res.product.category);
      setPrice(String(res.product.price));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onSubmit = async () => {
    if (!title || !description || !category || !price) {
      return Alert.alert("Error", "Please fill all fields");
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return Alert.alert("Error", "Price must be a valid non-negative number");
    }
    setSaving(true);
    try {
      await updateProduct(id!, {
        title,
        description,
        category,
        price: priceNum,
      });
      Alert.alert("Saved", "Product updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !item)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Product</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={onSubmit}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#2E7D32",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
