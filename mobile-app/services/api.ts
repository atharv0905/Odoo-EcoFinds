import { Cart, Product, Purchase, User, ProductImage } from '../types/api';
import { http } from './http';

// Users
export const createUser = async (payload: { email: string; name: string }) => {
  const { data } = await http.post<{ message: string; user: User }>(`/api/users/`, payload);
  return data;
};

// Create user from Firebase (new preferred method)
export const createUserFromFirebase = async (payload: { firebaseId: string; email: string; name: string }) => {
  const { data } = await http.post<{ message: string; user: User }>(`/api/users/firebase`, payload);
  return data;
};

// Get user by Firebase ID
export const getUserByFirebaseId = async (firebaseId: string) => {
  const { data } = await http.get<{ message: string; user: User }>(`/api/users/firebase/${firebaseId}`);
  return data;
};

export const getUser = async (id: string) => {
  const { data } = await http.get<{ message: string; user: User }>(`/api/users/${id}`);
  return data;
};

export const getUserByEmail = async (email: string) => {
  const { data } = await http.get<{ message: string; user: User }>(`/api/users/email/${email}`);
  return data;
};

export const updateUser = async (id: string, payload: Partial<User>) => {
  const { data } = await http.put<{ message: string; user: User }>(`/api/users/${id}`, payload);
  return data;
};

export const updateUserProfile = async (id: string, payload: { name?: string; phone?: string }) => {
  const { data } = await http.put<{ message: string; user: User }>(`/api/users/${id}/profile`, payload);
  return data;
};

export const updateUserPaymentConfig = async (
  id: string,
  payload: { paymentConfig: User['paymentConfig'] }
) => {
  const { data } = await http.put<{ message: string; user: User }>(`/api/users/${id}/payment-config`, payload);
  return data;
};

export const updateUserGamification = async (
  id: string,
  payload: { gamification: User['gamification'] }
) => {
  const { data } = await http.put<{ message: string; user: User }>(`/api/users/${id}/gamification`, payload);
  return data;
};

// Products
export const createProduct = async (payload: Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'isActive' | 'totalSold' | 'views'>) => {
  const { data } = await http.post<{ message: string; product: Product }>(`/api/products/`, payload);
  return data;
};

// Create product with multiple images using FormData
export const createProductWithImages = async (payload: {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  createdByFId: string; // Firebase ID
  imageUris: string[];
}) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('category', payload.category);
  formData.append('price', payload.price.toString());
  formData.append('stock', payload.stock.toString());
  formData.append('createdByFId', payload.createdByFId); // Use Firebase ID
  
  // Add images
  for (let i = 0; i < payload.imageUris.length; i++) {
    const uri = payload.imageUris[i];
    const filename = `image_${i}_${Date.now()}.jpg`;
    
    formData.append('images', {
      uri,
      type: 'image/jpeg',
      name: filename,
    } as any);
  }
  
  const { data } = await http.post<{ message: string; product: Product; imageCount: number }>(
    `/api/products/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
};

// Add images to existing product
export const addProductImages = async (productId: string, createdByFId: string, imageUris: string[]) => {
  const formData = new FormData();
  
  formData.append('createdByFId', createdByFId); // Use Firebase ID
  
  // Add images
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    const filename = `image_${i}_${Date.now()}.jpg`;
    
    formData.append('images', {
      uri,
      type: 'image/jpeg',
      name: filename,
    } as any);
  }
  
  const { data } = await http.post<{ message: string; product: Product; newImagesCount: number; totalImagesCount: number }>(
    `/api/products/${productId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
};

export const updateProduct = async (id: string, payload: Partial<Product>) => {
  const { data } = await http.put<{ message: string; product: Product }>(`/api/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string) => {
  const { data } = await http.delete<{ message: string; product: Product }>(`/api/products/${id}`);
  return data;
};

export const getAllProducts = async (page = 1, limit = 20) => {
  const { data } = await http.get<{ message: string; products: Product[]; count: number }>(`/api/products/`, { params: { page, limit } });
  return data;
};

export const getProductById = async (id: string) => {
  const { data } = await http.get<{ message: string; product: Product }>(`/api/products/${id}`);
  return data;
};

export const getProductsByUser = async (userId: string) => {
  const { data } = await http.get<{ message: string; products: Product[]; count: number }>(`/api/products/user/${userId}`);
  return data;
};

// Get products by Firebase ID (new preferred method)
export const getProductsByFirebaseId = async (firebaseId: string) => {
  const { data } = await http.get<{ message: string; products: Product[]; count: number }>(`/api/products/user/firebase/${firebaseId}`);
  return data;
};

export const smartSearchProducts = async (q: string, page = 1, limit = 10) => {
  const { data } = await http.get<{ message: string; results: Product[]; pagination: any; query: string }>(
    `/api/products/smart-search`, { params: { q, page, limit } }
  );
  return data;
};

export const filterProductsByCategory = async (category: string) => {
  const { data } = await http.get<{ message: string; products: Product[]; count: number }>(
    `/api/products/filter/${encodeURIComponent(category)}`
  );
  return data;
};

// Cart
export const addToCart = async (payload: { userId: string; productId: string; quantity?: number }) => {
  const { data } = await http.post<{ message: string; cart: Cart }>(`/api/cart/add`, payload);
  return data;
};

export const getCart = async (userId: string) => {
  const { data } = await http.get<{ message: string; cart: Cart; totalItems: number }>(`/api/cart/${userId}`);
  return data;
};

export const removeFromCart = async (userId: string, productId: string) => {
  const { data } = await http.delete<{ message: string; cart: Cart }>(`/api/cart/${userId}/${productId}`);
  return data;
};

// Purchases
export const addPurchase = async (payload: { userId: string; products: string[] }) => {
  const { data } = await http.post<{ message: string; purchase: Purchase }>(`/api/purchases/`, payload);
  return data;
};

export const getPurchases = async (userId: string) => {
  const { data } = await http.get<{ message: string; purchases: Purchase[]; count: number; totalProducts: number }>(
    `/api/purchases/${userId}`
  );
  return data;
};

// Product Orders
export const createProductOrder = async (payload: {
  productId: string;
  sellerId: string;
  buyerId: string;
  quantity: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}) => {
  const { data } = await http.post<{ message: string; order: any }>(`/api/product-orders/`, payload);
  return data;
};

export const getSellerOrders = async (sellerId: string, status?: string) => {
  const params = status ? { status } : {};
  const { data } = await http.get<{ message: string; orders: any[]; summary: any }>(
    `/api/product-orders/seller/${sellerId}`, { params }
  );
  return data;
};

export const getBuyerOrders = async (buyerId: string, status?: string) => {
  const params = status ? { status } : {};
  const { data } = await http.get<{ message: string; orders: any[]; count: number }>(
    `/api/product-orders/buyer/${buyerId}`, { params }
  );
  return data;
};

export const getProductOrders = async (productId: string) => {
  const { data } = await http.get<{ message: string; orders: any[]; count: number }>(
    `/api/product-orders/product/${productId}`
  );
  return data;
};

export const updateOrderStatus = async (orderId: string, status: string, sellerId: string) => {
  const { data } = await http.patch<{ message: string; order: any }>(
    `/api/product-orders/${orderId}/status`, { status, sellerId }
  );
  return data;
};

export const cancelOrder = async (orderId: string, userId: string, reason?: string) => {
  const { data } = await http.patch<{ message: string; order: any }>(
    `/api/product-orders/${orderId}/cancel`, { userId, reason }
  );
  return data;
};

export const getSellerStats = async (sellerId: string) => {
  const { data } = await http.get<{ message: string; stats: any }>(
    `/api/product-orders/seller/${sellerId}/stats`
  );
  return data;
};

// Update Product Stock
export const updateProductStock = async (productId: string, stock: number, createdByFId: string) => {
  const { data } = await http.patch<{ message: string; product: Product }>(
    `/api/products/${productId}/stock`, { stock, createdByFId } // Use Firebase ID
  );
  return data;
};

// Delete Product
export const deleteProductByFirebaseId = async (productId: string, createdByFId: string) => {
  const { data } = await http.delete<{ message: string; product: Product }>(
    `/api/products/${productId}`, { data: { createdByFId } } // Use Firebase ID
  );
  return data;
};


