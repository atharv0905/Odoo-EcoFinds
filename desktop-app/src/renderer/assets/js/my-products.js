// My Products Page Script
class MyProductsManager {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.filteredProducts = [];
        this.editingProductId = null;
        this.currentProductOrders = [];
        this.isLoading = false;
    }

    async init() {
        await this.waitForServices();
        this.bindEvents();
        this.addMyProductsStyles();
        
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadProducts();
                this.loadStats();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    async waitForServices() {
        while (!window.authService || !window.apiService || !window.authService.isInitialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    bindEvents() {
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showAddProductModal());
        }

        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Search and filters
        const productSearch = document.getElementById('productSearch');
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (productSearch) {
            productSearch.addEventListener('input', () => this.filterProducts());
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterProducts());
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterProducts());
        }

        // Global functions
        window.showAddProductModal = () => this.showAddProductModal();
        window.hideProductModal = () => this.hideProductModal();
        window.hideStockModal = () => this.hideStockModal();
        window.hideOrdersModal = () => this.hideOrdersModal();
        window.updateStock = () => this.updateStock();
        window.showProductOrders = () => this.showAllProductOrders();
        window.showLowStockProducts = () => this.showLowStockProducts();
        window.showAnalytics = () => this.showAnalytics();
    }

    async loadProducts() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            const result = await window.apiService.getUserProducts(this.currentUser.uid);
            this.products = result.products || [];
            this.filteredProducts = [...this.products];

            if (this.products.length === 0) {
                this.showNoProducts();
            } else {
                this.renderProducts();
                this.showProductsGrid();
            }

        } catch (error) {
            console.error('Failed to load products:', error);
            this.showMessage('Failed to load products. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async loadStats() {
        if (!this.currentUser) return;

        try {
            // Load seller stats
            const stats = await window.apiService.getSellerStats(this.currentUser.uid);
            
            // Update stats display
            document.getElementById('totalProducts').textContent = this.products.length;
            document.getElementById('activeProducts').textContent = this.products.filter(p => p.isActive).length;
            document.getElementById('totalOrders').textContent = stats.stats.totalOrders || 0;
            document.getElementById('totalRevenue').textContent = `$${(stats.stats.totalRevenue || 0).toFixed(2)}`;

        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        this.filteredProducts = this.products.filter(product => {
            // Search filter
            const matchesSearch = !searchTerm || 
                product.title.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm);

            // Status filter
            let matchesStatus = true;
            if (statusFilter !== 'all') {
                switch (statusFilter) {
                    case 'active':
                        matchesStatus = product.isActive;
                        break;
                    case 'inactive':
                        matchesStatus = !product.isActive;
                        break;
                    case 'low_stock':
                        matchesStatus = product.stock > 0 && product.stock <= 5;
                        break;
                    case 'out_of_stock':
                        matchesStatus = product.stock === 0;
                        break;
                }
            }

            // Category filter
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });

        this.renderProducts();
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="no-filtered-products">No products match your filters.</div>';
            return;
        }

        const productsHTML = this.filteredProducts.map(product => this.createProductCardHTML(product)).join('');
        productsGrid.innerHTML = productsHTML;

        this.bindProductEvents();
    }

    createProductCardHTML(product) {
        const statusClass = this.getProductStatusClass(product);
        const statusText = this.getProductStatusText(product);
        const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=Product';

        return `
            <div class="product-card ${statusClass}" data-product-id="${product._id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.title}" loading="lazy">
                    <div class="product-status-badge ${statusClass}">${statusText}</div>
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${this.truncateText(product.description, 80)}</p>
                    <div class="product-category">${product.category}</div>
                    
                    <div class="product-stats">
                        <div class="stat-item">
                            <span class="stat-label">Price:</span>
                            <span class="stat-value">$${parseFloat(product.price).toFixed(2)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Stock:</span>
                            <span class="stat-value stock-${this.getStockStatus(product.stock)}">${product.stock}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Sold:</span>
                            <span class="stat-value">${product.totalSold || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Views:</span>
                            <span class="stat-value">${product.views || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="action-btn edit-btn" onclick="editProduct('${product._id}')">
                        <span class="btn-icon">✏️</span>
                        Edit
                    </button>
                    
                    <button class="action-btn stock-btn" onclick="showStockModal('${product._id}')">
                        <span class="btn-icon">📦</span>
                        Stock
                    </button>
                    
                    <button class="action-btn orders-btn" onclick="showProductOrdersModal('${product._id}')">
                        <span class="btn-icon">📋</span>
                        Orders
                    </button>
                    
                    <button class="action-btn ${product.isActive ? 'deactivate-btn' : 'activate-btn'}" 
                            onclick="toggleProductStatus('${product._id}')">
                        <span class="btn-icon">${product.isActive ? '❌' : '✅'}</span>
                        ${product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `;
    }

    bindProductEvents() {
        // Global functions for product actions
        window.editProduct = (productId) => this.editProduct(productId);
        window.showStockModal = (productId) => this.showStockModal(productId);
        window.showProductOrdersModal = (productId) => this.showProductOrdersModal(productId);
        window.toggleProductStatus = (productId) => this.toggleProductStatus(productId);
    }

    showAddProductModal() {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        modalTitle.textContent = 'Add New Product';
        form.reset();
        this.editingProductId = null;
        
        modal.classList.remove('hidden');
    }

    hideProductModal() {
        const modal = document.getElementById('productModal');
        modal.classList.add('hidden');
        this.editingProductId = null;
    }

    async editProduct(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        modalTitle.textContent = 'Edit Product';
        this.editingProductId = productId;
        
        // Populate form
        document.getElementById('productTitle').value = product.title;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productImage').value = product.image || '';
        
        modal.classList.remove('hidden');
    }

    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const productData = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            image: formData.get('image'),
            createdBy: this.currentUser.uid
        };

        this.setLoadingState('saveProductBtn', true);

        try {
            if (this.editingProductId) {
                // Update existing product
                await window.apiService.updateProduct(this.editingProductId, productData);
                this.showMessage('Product updated successfully!', 'success');
            } else {
                // Create new product
                await window.apiService.createProduct(productData);
                this.showMessage('Product created successfully!', 'success');
            }

            this.hideProductModal();
            await this.loadProducts();
            await this.loadStats();

        } catch (error) {
            console.error('Failed to save product:', error);
            this.showMessage('Failed to save product. Please try again.', 'error');
        } finally {
            this.setLoadingState('saveProductBtn', false);
        }
    }

    showStockModal(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        const modal = document.getElementById('stockModal');
        const productName = document.getElementById('stockProductName');
        const currentStock = document.getElementById('currentStock');
        const newStock = document.getElementById('newStock');
        
        productName.textContent = product.title;
        currentStock.textContent = product.stock;
        newStock.value = product.stock;
        
        modal.classList.remove('hidden');
        this.editingProductId = productId;
    }

    hideStockModal() {
        const modal = document.getElementById('stockModal');
        modal.classList.add('hidden');
        this.editingProductId = null;
    }

    async updateStock() {
        if (!this.editingProductId) return;

        const newStock = parseInt(document.getElementById('newStock').value);
        if (isNaN(newStock) || newStock < 0) {
            this.showMessage('Please enter a valid stock quantity.', 'error');
            return;
        }

        try {
            await window.apiService.updateProductStock(this.editingProductId, newStock, this.currentUser.uid);
            this.showMessage('Stock updated successfully!', 'success');
            
            this.hideStockModal();
            await this.loadProducts();
            await this.loadStats();

        } catch (error) {
            console.error('Failed to update stock:', error);
            this.showMessage('Failed to update stock. Please try again.', 'error');
        }
    }

    async showProductOrdersModal(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        try {
            const result = await window.apiService.getProductOrders(productId);
            this.currentProductOrders = result.orders || [];

            const modal = document.getElementById('ordersModal');
            const ordersList = document.getElementById('productOrdersList');
            
            if (this.currentProductOrders.length === 0) {
                ordersList.innerHTML = '<div class="no-orders">No orders for this product yet.</div>';
            } else {
                const ordersHTML = this.currentProductOrders.map(order => this.createOrderItemHTML(order)).join('');
                ordersList.innerHTML = ordersHTML;
            }

            modal.classList.remove('hidden');

        } catch (error) {
            console.error('Failed to load product orders:', error);
            this.showMessage('Failed to load orders. Please try again.', 'error');
        }
    }

    hideOrdersModal() {
        const modal = document.getElementById('ordersModal');
        modal.classList.add('hidden');
    }

    createOrderItemHTML(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const statusClass = order.status.toLowerCase().replace('_', '-');

        return `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
                    <div class="order-status status-${statusClass}">${order.status.replace('_', ' ').toUpperCase()}</div>
                </div>
                
                <div class="order-details">
                    <div class="order-info">
                        <span class="info-label">Quantity:</span>
                        <span class="info-value">${order.quantity}</span>
                    </div>
                    <div class="order-info">
                        <span class="info-label">Total:</span>
                        <span class="info-value">$${order.totalPrice.toFixed(2)}</span>
                    </div>
                    <div class="order-info">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${orderDate}</span>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-secondary btn-sm" onclick="updateOrderStatus('${order._id}', 'confirmed')">
                        Confirm
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="updateOrderStatus('${order._id}', 'shipped')">
                        Ship
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order._id}', 'cancelled')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    async toggleProductStatus(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        try {
            const newStock = product.isActive ? 0 : Math.max(1, product.stock);
            await window.apiService.updateProductStock(productId, newStock, this.currentUser.uid);
            
            this.showMessage(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully!`, 'success');
            await this.loadProducts();
            await this.loadStats();

        } catch (error) {
            console.error('Failed to toggle product status:', error);
            this.showMessage('Failed to update product status. Please try again.', 'error');
        }
    }

    showAllProductOrders() {
        window.location.href = 'product-orders.html';
    }

    showLowStockProducts() {
        document.getElementById('statusFilter').value = 'low_stock';
        this.filterProducts();
        this.showMessage('Showing products with low stock (≤5 items)', 'info');
    }

    showAnalytics() {
        // For now, show a simple analytics summary
        const totalProducts = this.products.length;
        const activeProducts = this.products.filter(p => p.isActive).length;
        const totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);
        const totalSold = this.products.reduce((sum, p) => sum + (p.totalSold || 0), 0);
        
        const message = `Analytics Summary:\n• Total Products: ${totalProducts}\n• Active Products: ${activeProducts}\n• Total Stock: ${totalStock}\n• Total Sold: ${totalSold}`;
        alert(message);
    }

    getProductStatusClass(product) {
        if (!product.isActive) return 'inactive';
        if (product.stock === 0) return 'out-of-stock';
        if (product.stock <= 5) return 'low-stock';
        return 'in-stock';
    }

    getProductStatusText(product) {
        if (!product.isActive) return 'Inactive';
        if (product.stock === 0) return 'Out of Stock';
        if (product.stock <= 5) return 'Low Stock';
        return 'In Stock';
    }

    getStockStatus(stock) {
        if (stock === 0) return 'out';
        if (stock <= 5) return 'low';
        return 'good';
    }

    showProductsGrid() {
        const productsGrid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (productsGrid) productsGrid.classList.remove('hidden');
        if (noProducts) noProducts.classList.add('hidden');
    }

    showNoProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (productsGrid) productsGrid.classList.add('hidden');
        if (noProducts) noProducts.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('productsLoading');
        const productsGrid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (productsGrid) productsGrid.classList.add('hidden');
            if (noProducts) noProducts.classList.add('hidden');
        } else {
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    setLoadingState(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const textEl = button.querySelector('[id$="Text"]');
        const loadingEl = button.querySelector('[id$="Loading"]');

        button.disabled = loading;
        
        if (loading) {
            if (textEl) textEl.classList.add('hidden');
            if (loadingEl) loadingEl.classList.remove('hidden');
        } else {
            if (textEl) textEl.classList.remove('hidden');
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    addMyProductsStyles() {
        const styleId = 'my-products-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .my-products-container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .header-content h1 {
                    color: #333;
                    margin: 0 0 0.5rem 0;
                }

                .page-subtitle {
                    color: #666;
                    margin: 0;
                    font-size: 1.1rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.3s;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                }

                .stat-card.products .stat-icon { color: #2196F3; }
                .stat-card.active .stat-icon { color: #4CAF50; }
                .stat-card.orders .stat-icon { color: #FF9800; }
                .stat-card.revenue .stat-icon { color: #9C27B0; }

                .stat-icon {
                    font-size: 2.5rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }

                .quick-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    color: #333;
                    text-decoration: none;
                }

                .action-btn:hover {
                    background: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                    transform: translateY(-2px);
                }

                .action-icon {
                    font-size: 1.5rem;
                }

                .action-text {
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .controls-section {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .search-controls {
                    flex: 1;
                    display: flex;
                    gap: 0.5rem;
                }

                .search-input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .filter-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .filter-select {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    color: #333;
                    cursor: pointer;
                }

                .loading-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #666;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #4CAF50;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .product-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    transition: transform 0.3s, box-shadow 0.3s;
                    border-left: 4px solid #4CAF50;
                }

                .product-card.low-stock {
                    border-left-color: #FF9800;
                }

                .product-card.out-of-stock {
                    border-left-color: #f44336;
                }

                .product-card.inactive {
                    border-left-color: #9E9E9E;
                    opacity: 0.7;
                }

                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }

                .product-image {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-status-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 0.25rem 0.5rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: white;
                }

                .product-status-badge.in-stock {
                    background: #4CAF50;
                }

                .product-status-badge.low-stock {
                    background: #FF9800;
                }

                .product-status-badge.out-of-stock {
                    background: #f44336;
                }

                .product-status-badge.inactive {
                    background: #9E9E9E;
                }

                .product-info {
                    padding: 1rem;
                }

                .product-title {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin: 0 0 0.5rem 0;
                    color: #333;
                }

                .product-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0 0 0.75rem 0;
                    line-height: 1.4;
                }

                .product-category {
                    background: #e8f5e8;
                    color: #4CAF50;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    display: inline-block;
                    margin-bottom: 0.75rem;
                }

                .product-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }

                .stat-label {
                    color: #666;
                }

                .stat-value {
                    font-weight: 500;
                    color: #333;
                }

                .stat-value.stock-good {
                    color: #4CAF50;
                }

                .stat-value.stock-low {
                    color: #FF9800;
                }

                .stat-value.stock-out {
                    color: #f44336;
                }

                .product-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: #f8f9fa;
                }

                .product-actions .action-btn {
                    padding: 0.5rem;
                    font-size: 0.8rem;
                    flex-direction: row;
                    justify-content: center;
                    gap: 0.25rem;
                }

                .no-products {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .no-products-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .no-products h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .no-products p {
                    color: #666;
                    margin-bottom: 2rem;
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .product-modal {
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .orders-modal {
                    max-width: 800px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #333;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-weight: 500;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
                }

                .form-help {
                    display: block;
                    margin-top: 0.25rem;
                    font-size: 0.85rem;
                    color: #666;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0e0;
                }

                .orders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .order-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 1rem;
                }

                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .order-id {
                    font-weight: bold;
                    color: #333;
                }

                .order-status {
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .status-pending {
                    background: #fff3e0;
                    color: #ff9800;
                }

                .status-confirmed {
                    background: #e3f2fd;
                    color: #2196f3;
                }

                .status-shipped {
                    background: #e8f5e8;
                    color: #4caf50;
                }

                .status-delivered {
                    background: #e8f5e8;
                    color: #4caf50;
                }

                .status-cancelled {
                    background: #ffebee;
                    color: #f44336;
                }

                .order-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }

                .order-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .info-label {
                    font-size: 0.8rem;
                    color: #666;
                }

                .info-value {
                    font-weight: 500;
                    color: #333;
                }

                .order-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-sm {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.8rem;
                }

                .no-filtered-products,
                .no-orders {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                    font-style: italic;
                }

                @media (max-width: 768px) {
                    .my-products-container {
                        padding: 0 0.5rem;
                    }

                    .page-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }

                    .controls-section {
                        flex-direction: column;
                    }

                    .products-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .order-details {
                        grid-template-columns: 1fr 1fr;
                    }

                    .order-actions {
                        flex-wrap: wrap;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize My Products when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const myProductsManager = new MyProductsManager();
    myProductsManager.init().catch(error => {
        console.error('Failed to initialize My Products:', error);
    });
});
