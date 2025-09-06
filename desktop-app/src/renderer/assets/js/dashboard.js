// Dashboard Page Script
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.currentSearch = '';
        this.products = [];
        this.isLoading = false;
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize dashboard
        this.bindEvents();
        this.loadUserData();
        
        // Check for search query from URL
        this.checkSearchQuery();
        
        // Load initial products
        await this.loadProducts();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserInfo(user);
                this.loadUserStats();
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
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });

        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Global clearFilters function
        window.clearFilters = () => this.clearFilters();
    }

    checkSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery) {
            this.currentSearch = searchQuery;
            // Update search input in navbar if it exists
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchQuery;
            }
        }
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            let result;
            
            if (this.currentSearch) {
                // Search products
                result = await window.apiService.smartSearchProducts(
                    this.currentSearch, 
                    this.currentPage, 
                    12
                );
                this.products = result.results || [];
            } else if (this.currentCategory !== 'all') {
                // Filter by category
                result = await window.apiService.filterProductsByCategory(this.currentCategory);
                this.products = result.products || [];
            } else {
                // Get all products
                result = await window.apiService.getAllProducts();
                this.products = result.products || [];
            }
            
            this.renderProducts();
            this.updatePagination(result.pagination);
            
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('Failed to load products. Please try again.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const noProductsFound = document.getElementById('noProductsFound');
        
        if (!this.products || this.products.length === 0) {
            productsGrid.innerHTML = '';
            noProductsFound.classList.remove('hidden');
            return;
        }
        
        noProductsFound.classList.add('hidden');
        
        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        productsGrid.innerHTML = productsHTML;
        
        // Bind add to cart events
        this.bindProductEvents();
    }

    createProductCard(product) {
        const price = parseFloat(product.price || 0).toFixed(2);
        const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=Eco+Product';
        
        return `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.title}" loading="lazy">
                    <div class="product-badge">🌱 Eco</div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${this.truncateText(product.description, 100)}</p>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">$${price}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
                            🛒 Add to Cart
                        </button>
                        <button class="btn btn-secondary view-product-btn" data-product-id="${product._id}">
                            👁️ View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindProductEvents() {
        // Add to cart buttons
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.getAttribute('data-product-id');
                await this.addToCart(productId);
            });
        });

        // View product buttons
        const viewBtns = document.querySelectorAll('.view-product-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                this.viewProduct(productId);
            });
        });
    }

    async addToCart(productId) {
        if (!this.currentUser) {
            this.showMessage('Please log in to add items to cart', 'error');
            return;
        }

        try {
            await window.apiService.addToCart(this.currentUser.uid, productId, 1);
            this.showMessage('Product added to cart!', 'success');
            
            // Update cart count in navbar
            if (window.navbarComponent) {
                await window.navbarComponent.loadCartCount();
            }
            
            // Update cart stats
            await this.loadUserStats();
            
        } catch (error) {
            console.error('Failed to add to cart:', error);
            this.showMessage('Failed to add to cart. Please try again.', 'error');
        }
    }

    viewProduct(productId) {
        // For now, just show an alert. In a full implementation, you'd navigate to a product detail page
        const product = this.products.find(p => p._id === productId);
        if (product) {
            alert(`Product: ${product.title}\nPrice: $${product.price}\nCategory: ${product.category}\n\nDescription: ${product.description}`);
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.currentSearch = '';
        
        // Update active filter button
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === category);
        });
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Remove search param from URL
        const url = new URL(window.location);
        url.searchParams.delete('search');
        window.history.replaceState({}, '', url);
        
        this.loadProducts();
    }

    clearFilters() {
        this.filterByCategory('all');
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadProducts();
        }
    }

    async nextPage() {
        this.currentPage++;
        await this.loadProducts();
    }

    updatePagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        
        if (!pagination) {
            paginationContainer.classList.add('hidden');
            return;
        }
        
        paginationContainer.classList.remove('hidden');
        
        if (prevBtn) prevBtn.disabled = !pagination.hasPrevPage;
        if (nextBtn) nextBtn.disabled = !pagination.hasNextPage;
        if (pageInfo) pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    }

    async loadUserStats() {
        if (!this.currentUser) return;
        
        try {
            // Load cart items
            const cartData = await window.apiService.getCartItems(this.currentUser.uid);
            document.getElementById('cartItems').textContent = cartData.totalItems || 0;
            
            // Load purchase history
            const purchaseData = await window.apiService.getPurchaseHistory(this.currentUser.uid);
            document.getElementById('purchaseCount').textContent = purchaseData.count || 0;
            
            // Load user profile for points
            const userData = await window.apiService.getUserById(this.currentUser.uid);
            if (userData.user && userData.user.gamification) {
                document.getElementById('userPoints').textContent = userData.user.gamification.points || 0;
            }
            
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
    }

    loadUserData() {
        // Load total products count
        this.loadProductsCount();
    }

    async loadProductsCount() {
        try {
            const result = await window.apiService.getAllProducts();
            document.getElementById('totalProducts').textContent = result.count || 0;
        } catch (error) {
            console.error('Failed to load products count:', error);
        }
    }

    updateUserInfo(user) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.displayName || user.email || 'User';
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const productsGrid = document.getElementById('productsGrid');
        
        if (show) {
            loadingState.classList.remove('hidden');
            productsGrid.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
            productsGrid.classList.remove('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Use navbar component message system if available
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init().catch(error => {
        console.error('Failed to initialize dashboard:', error);
    });
});

// Add necessary CSS for new dashboard components
const dashboardStyles = `
    <style>
        .search-filter-section {
            margin: 1.5rem 0;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
        }

        .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 20px;
            color: #333;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.9rem;
        }

        .filter-btn:hover, .filter-btn.active {
            background: #4CAF50;
            color: white;
            transform: translateY(-2px);
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

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .product-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
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

        .product-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .product-info {
            padding: 1rem;
        }

        .product-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #333;
        }

        .product-description {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
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

        .product-price {
            font-size: 1.25rem;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 1rem;
        }

        .product-actions {
            display: flex;
            gap: 0.5rem;
        }

        .product-actions .btn {
            flex: 1;
            padding: 0.5rem;
            font-size: 0.9rem;
        }

        .no-products-found {
            text-align: center;
            padding: 3rem 1rem;
        }

        .no-products-content {
            max-width: 400px;
            margin: 0 auto;
        }

        .no-products-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .no-products-found h3 {
            color: #333;
            margin-bottom: 1rem;
        }

        .no-products-found p {
            color: #666;
            margin-bottom: 0.5rem;
        }

        .pagination-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin: 2rem 0;
        }

        .page-info {
            color: #666;
            font-weight: 500;
        }

        @media (max-width: 768px) {
            .products-grid {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .filter-buttons {
                justify-content: flex-start;
                overflow-x: auto;
                padding-bottom: 0.5rem;
            }
            
            .filter-btn {
                white-space: nowrap;
            }
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', dashboardStyles);