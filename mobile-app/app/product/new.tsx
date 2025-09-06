import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createProductWithImages } from "../../services/api";
import { useApiUser } from "../../contexts/ApiUserContext";
import { router } from "expo-router";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Kitchen",
  "Personal Care",
  "Books",
  "Sports",
  "Toys",
  "Automotive",
  "Health",
  "Custom", // Option to add custom category
];

const STATIC_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80";

export default function NewProductScreen() {
  const { firebaseUserId } = useApiUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const onSubmit = async () => {
    if (!firebaseUserId)
      return Alert.alert("Error", "User not ready. Try again.");

    // Determine the final category
    const finalCategory = category === "Custom" ? customCategory : category;

    if (!title || !description || !finalCategory || !price || !stock) {
      return Alert.alert("Error", "Please fill all fields");
    }
    if (selectedImages.length === 0) {
      return Alert.alert("Error", "Please select at least one image");
    }
    if (selectedImages.length > 5) {
      return Alert.alert("Error", "Maximum 5 images allowed");
    }
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (isNaN(priceNum) || priceNum < 0) {
      return Alert.alert("Error", "Price must be a valid non-negative number");
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return Alert.alert("Error", "Stock must be a valid non-negative number");
    }
    setLoading(true);
    try {
      await createProductWithImages({
        title,
        description,
        category: finalCategory,
        price: priceNum,
        stock: stockNum,
        imageUris: selectedImages,
        createdByFId: firebaseUserId, // Use Firebase ID
      });
      Alert.alert("Success", "Product created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const imageUris = result.assets.map((asset) => asset.uri);
      setSelectedImages(imageUris);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderImageItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.selectedImage} />
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeImage(index)}
      >
        <Text style={styles.removeBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Product</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Image Selection Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
            <Text style={styles.pickBtnText}>
              {selectedImages.length > 0
                ? `${selectedImages.length} Images Selected`
                : "Pick Images (1-5)"}
            </Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <FlatList
              data={selectedImages}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `image-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesList}
              contentContainerStyle={styles.imagesListContent}
            />
          )}
        </View>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        {/* Category Selection */}
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            style={[styles.categoryText, !category && styles.placeholderText]}
          >
            {category || "Select Category"}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        {category === "Custom" && (
          <TextInput
            style={styles.input}
            placeholder="Enter custom category"
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Stock Quantity"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={onSubmit}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Product"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat);
                    if (cat !== "Custom") {
                      setCustomCategory(""); // Clear custom category if not custom
                    }
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  imageSection: {
    marginBottom: 16,
  },
  imagesList: {
    marginTop: 12,
  },
  imagesListContent: {
    paddingRight: 16,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff4444",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pickBtnText: { color: "#fff", fontWeight: "700" },

  // Category Selector Styles
  categorySelector: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 16,
    color: "#000",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  modalClose: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#333",
  },
});
