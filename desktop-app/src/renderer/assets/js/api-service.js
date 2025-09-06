// API Service for EcoFinds Backend
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.currentUser = null;
    }

    // Set current user (called from auth service)
    setCurrentUser(user) {
        this.currentUser = user;
    }

    // Generic API call method
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error(`API call failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    // User Management
    async createUser(userData) {
        return await this.apiCall('/users', 'POST', userData);
    }

    async getUserById(userId) {
        return await this.apiCall(`/users/${userId}`);
    }

    async updateUserProfile(userId, profileData) {
        return await this.apiCall(`/users/${userId}/profile`, 'PUT', profileData);
    }

    async updatePaymentConfig(userId, paymentConfig) {
        return await this.apiCall(`/users/${userId}/payment-config`, 'PUT', { paymentConfig });
    }

    async updateGamification(userId, gamificationData) {
        return await this.apiCall(`/users/${userId}/gamification`, 'PUT', { gamification: gamificationData });
    }

    async getAllUsers() {
        return await this.apiCall('/users');
    }

    // Product Management
    async getAllProducts() {
        return await this.apiCall('/products');
    }

    async getProductById(productId) {
        return await this.apiCall(`/products/${productId}`);
    }

    async createProduct(productData) {
        return await this.apiCall('/products', 'POST', productData);
    }

    async updateProduct(productId, productData) {
        return await this.apiCall(`/products/${productId}`, 'PUT', productData);
    }

    async deleteProduct(productId) {
        return await this.apiCall(`/products/${productId}`, 'DELETE');
    }

    async getUserProducts(userId) {
        return await this.apiCall(`/products/user/${userId}`);
    }

    async smartSearchProducts(query, page = 1, limit = 10) {
        return await this.apiCall(`/products/smart-search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    }

    async searchProducts(keyword) {
        return await this.apiCall(`/products/search/${encodeURIComponent(keyword)}`);
    }

    async filterProductsByCategory(category) {
        return await this.apiCall(`/products/filter/${encodeURIComponent(category)}`);
    }

    // Cart Management
    async addToCart(userId, productId, quantity = 1) {
        return await this.apiCall('/cart/add', 'POST', { userId, productId, quantity });
    }

    async getCartItems(userId) {
        return await this.apiCall(`/cart/${userId}`);
    }

    async removeFromCart(userId, productId) {
        return await this.apiCall(`/cart/${userId}/${productId}`, 'DELETE');
    }

    // Purchase Management
    async createPurchase(userId, products) {
        return await this.apiCall('/purchases', 'POST', { userId, products });
    }

    async getPurchaseHistory(userId) {
        return await this.apiCall(`/purchases/${userId}`);
    }

    // Product Order Management (for sellers)
    async createProductOrder(orderData) {
        return await this.apiCall('/product-orders', 'POST', orderData);
    }

    async getSellerOrders(sellerId, status = null) {
        const url = status ? `/product-orders/seller/${sellerId}?status=${status}` : `/product-orders/seller/${sellerId}`;
        return await this.apiCall(url);
    }

    async getBuyerOrders(buyerId, status = null) {
        const url = status ? `/product-orders/buyer/${buyerId}?status=${status}` : `/product-orders/buyer/${buyerId}`;
        return await this.apiCall(url);
    }

    async getProductOrders(productId) {
        return await this.apiCall(`/product-orders/product/${productId}`);
    }

    async getProductOrderById(orderId) {
        return await this.apiCall(`/product-orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status, sellerId) {
        return await this.apiCall(`/product-orders/${orderId}/status`, 'PATCH', { status, sellerId });
    }

    async cancelOrder(orderId, userId, reason = '') {
        return await this.apiCall(`/product-orders/${orderId}/cancel`, 'PATCH', { userId, reason });
    }

    async getSellerStats(sellerId) {
        return await this.apiCall(`/product-orders/seller/${sellerId}/stats`);
    }

    // Product Stock Management
    async updateProductStock(productId, stock, createdBy) {
        return await this.apiCall(`/products/${productId}/stock`, 'PATCH', { stock, createdBy });
    }

    async getAllProductsForManagement() {
        return await this.apiCall('/products/all/management');
    }

    // Utility Methods
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'ERROR', error: error.message };
        }
    }

    // Hash function for Razorpay credentials (basic implementation)
    hashRazorpayCredentials(keyId, secret) {
        // In a production environment, you'd want to use a more secure hashing method
        // This is a simple example - consider using crypto-js or similar library
        const combined = keyId + secret;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Process payment configuration
    processPaymentConfig(config) {
        if (config.mode === 'razorpay_direct' && config.razorpayKeyId && config.razorpaySecret) {
            // Hash the Razorpay credentials before sending to API
            return {
                ...config,
                razorpayKeyId: this.hashRazorpayCredentials(config.razorpayKeyId, ''),
                razorpaySecret: this.hashRazorpayCredentials(config.razorpaySecret, '')
            };
        }
        return config;
    }
}

// Create global instance
window.apiService = new ApiService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
