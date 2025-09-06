// Get API URL from environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple API utility for making requests
export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// API Service class for EcoFinds
export class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Generic API call method
  async apiCall<T = unknown>(endpoint: string, method = 'GET', data?: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    return apiFetch<T>(url, config);
  }

  // Product Management
  async getAllProducts() {
    return this.apiCall('/products');
  }

  async getProductById(productId: string) {
    return this.apiCall(`/products/${productId}`);
  }

  async getUserProducts(userId: string) {
    return this.apiCall(`/products/user/${userId}`);
  }

  async createProduct(productData: unknown) {
    return this.apiCall('/products', 'POST', productData);
  }

  async updateProduct(productId: string, productData: unknown) {
    return this.apiCall(`/products/${productId}`, 'PUT', productData);
  }

  async deleteProduct(productId: string) {
    return this.apiCall(`/products/${productId}`, 'DELETE');
  }

  async searchProducts(query: string) {
    return this.apiCall(`/products/search/${encodeURIComponent(query)}`);
  }

  // Cart Management
  async addToCart(userId: string, productId: string, quantity = 1) {
    return this.apiCall('/cart/add', 'POST', { userId, productId, quantity });
  }

  async getCartItems(userId: string) {
    return this.apiCall(`/cart/${userId}`);
  }

  async removeFromCart(userId: string, productId: string) {
    return this.apiCall(`/cart/${userId}/${productId}`, 'DELETE');
  }

  // Order Management (Cart-to-Checkout Flow)
  async saveOrderFromCart(orderData: unknown) {
    return this.apiCall('/orders/save-from-cart', 'POST', orderData);
  }

  async getOrderById(orderId: string) {
    return this.apiCall(`/orders/${orderId}`);
  }

  async getBuyerOrders(buyerId: string, status?: string) {
    const url = status ? `/orders/buyer/${buyerId}?status=${status}` : `/orders/buyer/${buyerId}`;
    return this.apiCall(url);
  }

  async markOrderForCheckout(orderId: string) {
    return this.apiCall(`/orders/${orderId}/checkout`, 'PATCH');
  }

  async cancelOrder(orderId: string, buyerId: string, reason = '') {
    return this.apiCall(`/orders/${orderId}/cancel`, 'PATCH', { buyerId, reason });
  }

  // User Management
  async createUser(userData: unknown) {
    return this.apiCall('/users', 'POST', userData);
  }

  async getUserById(userId: string) {
    return this.apiCall(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, profileData: unknown) {
    return this.apiCall(`/users/${userId}/profile`, 'PUT', profileData);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'ERROR', error: (error as Error).message };
    }
  }

  // Get current API URL
  getApiUrl(): string {
    return this.baseURL;
  }

  // Check if running in development mode
  isDevelopment(): boolean {
    return import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
  }
}

// Create global instance
export const apiService = new ApiService();
