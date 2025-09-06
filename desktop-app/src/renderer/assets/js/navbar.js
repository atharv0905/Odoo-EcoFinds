// Navbar Component for EcoFinds
class NavbarComponent {
    constructor() {
        this.currentUser = null;
        this.cartItemCount = 0;
        this.isInitialized = false;
    }

    // Initialize navbar component
    init() {
        if (this.isInitialized) return;
        
        this.createNavbar();
        this.bindEvents();
        this.loadCartCount();
        this.isInitialized = true;
    }

    // Create navbar HTML structure
    createNavbar() {
        const navbarHTML = `
            <nav class="navbar">
                <div class="navbar-container">
                    <!-- Brand -->
                    <div class="navbar-brand">
                        <a href="dashboard.html" class="brand-link">
                            <span class="brand-icon">🌱</span>
                            <span class="brand-text">EcoFinds</span>
                        </a>
                    </div>

                    <!-- Search Bar -->
                    <div class="navbar-search">
                        <div class="search-container">
                            <input type="text" id="searchInput" placeholder="Search eco-friendly products..." class="search-input">
                            <button id="searchBtn" class="search-btn">
                                <span class="search-icon">🔍</span>
                            </button>
                        </div>
                    </div>

                    <!-- Navigation Items -->
                    <div class="navbar-nav">
                        <a href="dashboard.html" class="nav-link" data-page="dashboard">
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">Home</span>
                        </a>
                        
                        <a href="leaderboard.html" class="nav-link" data-page="leaderboard">
                            <span class="nav-icon">🏆</span>
                            <span class="nav-text">Leaderboard</span>
                        </a>
                        
                        <a href="my-products.html" class="nav-link" data-page="my-products">
                            <span class="nav-icon">📦</span>
                            <span class="nav-text">My Products</span>
                        </a>
                        
                        <a href="cart.html" class="nav-link cart-link" data-page="cart">
                            <span class="nav-icon">🛒</span>
                            <span class="nav-text">Cart</span>
                            <span class="cart-badge" id="cartBadge">0</span>
                        </a>
                        
                        <a href="purchases.html" class="nav-link" data-page="purchases">
                            <span class="nav-icon">📦</span>
                            <span class="nav-text">Purchases</span>
                        </a>
                        
                        <a href="settings.html" class="nav-link" data-page="settings">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-text">Settings</span>
                        </a>
                        
                        <div class="nav-profile">
                            <div class="profile-dropdown">
                                <button class="profile-btn" id="profileBtn">
                                    <span class="profile-icon">👤</span>
                                    <span class="profile-name" id="profileName">User</span>
                                    <span class="dropdown-arrow">▼</span>
                                </button>
                                <div class="profile-menu" id="profileMenu">
                                    <a href="profile.html" class="profile-menu-item">
                                        <span class="menu-icon">👤</span>
                                        Profile
                                    </a>
                                    <div class="profile-menu-divider"></div>
                                    <button class="profile-menu-item logout-btn" id="navLogoutBtn">
                                        <span class="menu-icon">🚪</span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        // Insert navbar at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        
        // Add navbar styles if not already present
        this.addNavbarStyles();
    }

    // Bind event listeners
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileMenu = document.getElementById('profileMenu');
        
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                profileMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                    profileMenu.classList.remove('show');
                }
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Active page highlighting
        this.highlightActivePage();
    }

    // Perform search
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();
        
        if (!query) {
            this.showMessage('Please enter a search term', 'warning');
            return;
        }

        try {
            // Store search query and redirect to dashboard with search
            localStorage.setItem('searchQuery', query);
            window.location.href = 'dashboard.html?search=' + encodeURIComponent(query);
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('Search failed. Please try again.', 'error');
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            if (window.authService) {
                const result = await window.authService.logout();
                if (result.success) {
                    window.location.href = 'login.html';
                } else {
                    this.showMessage('Logout failed. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout failed. Please try again.', 'error');
        }
    }

    // Load cart item count
    async loadCartCount() {
        try {
            if (window.authService && window.apiService) {
                const user = window.authService.getCurrentUser();
                if (user) {
                    const cartData = await window.apiService.getCartItems(user.uid);
                    this.updateCartCount(cartData.totalItems || 0);
                }
            }
        } catch (error) {
            console.error('Failed to load cart count:', error);
        }
    }

    // Update cart badge count
    updateCartCount(count) {
        this.cartItemCount = count;
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    // Set current user
    setUser(user) {
        this.currentUser = user;
        const profileName = document.getElementById('profileName');
        if (profileName && user) {
            profileName.textContent = user.displayName || user.email || 'User';
        }
    }

    // Highlight active page
    highlightActivePage() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('data-page');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('navbarMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'navbarMessage';
            messageEl.className = 'navbar-message';
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.className = `navbar-message navbar-message-${type} show`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }

    // Add navbar styles
    addNavbarStyles() {
        const styleId = 'navbar-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .navbar {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    width: 100%;
                }

                /* Add top margin to body to account for fixed navbar */
                body {
                    margin-top: 80px !important;
                }

                .navbar-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    gap: 1rem;
                }

                .navbar-brand .brand-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                    color: white;
                    font-size: 1.25rem;
                    font-weight: bold;
                }

                .brand-icon {
                    font-size: 1.5rem;
                }

                .navbar-search {
                    flex: 1;
                    max-width: 400px;
                }

                .search-container {
                    display: flex;
                    background: white;
                    border-radius: 25px;
                    overflow: hidden;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .search-input {
                    flex: 1;
                    border: none;
                    padding: 0.75rem 1rem;
                    font-size: 0.9rem;
                    outline: none;
                }

                .search-btn {
                    background: #4CAF50;
                    border: none;
                    padding: 0.75rem 1rem;
                    color: white;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .search-btn:hover {
                    background: #45a049;
                }

                .navbar-nav {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .nav-link {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.5rem;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    transition: background 0.3s;
                    font-size: 0.8rem;
                    position: relative;
                }

                .nav-link:hover, .nav-link.active {
                    background: rgba(255,255,255,0.2);
                }

                .nav-icon {
                    font-size: 1.2rem;
                }

                .cart-link {
                    position: relative;
                }

                .cart-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4444;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .nav-profile {
                    position: relative;
                }

                .profile-dropdown {
                    position: relative;
                }

                .profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .profile-btn:hover {
                    background: rgba(255,255,255,0.3);
                }

                .profile-name {
                    font-size: 0.9rem;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-arrow {
                    font-size: 0.7rem;
                    transition: transform 0.3s;
                }

                .profile-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                    min-width: 150px;
                    overflow: hidden;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.3s;
                    margin-top: 0.5rem;
                }

                .profile-menu.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .profile-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    color: #333;
                    text-decoration: none;
                    background: none;
                    border: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .profile-menu-item:hover {
                    background: #f5f5f5;
                }

                .profile-menu-divider {
                    height: 1px;
                    background: #eee;
                    margin: 0.25rem 0;
                }

                .navbar-message {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s;
                }

                .navbar-message.show {
                    opacity: 1;
                    transform: translateX(0);
                }

                .navbar-message-info {
                    background: #2196F3;
                }

                .navbar-message-success {
                    background: #4CAF50;
                }

                .navbar-message-warning {
                    background: #FF9800;
                }

                .navbar-message-error {
                    background: #f44336;
                }

                @media (max-width: 768px) {
                    .navbar-container {
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }

                    .navbar-search {
                        order: 3;
                        flex: 1 1 100%;
                    }

                    .nav-text {
                        display: none;
                    }

                    .profile-name {
                        display: none;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Create global navbar instance
window.navbarComponent = new NavbarComponent();

// Auto-initialize on DOM load for pages with navbar
document.addEventListener('DOMContentLoaded', () => {
    const shouldShowNavbar = !window.location.pathname.includes('login.html') && 
                            !window.location.pathname.includes('register.html') &&
                            !window.location.pathname.includes('index.html');
    
    if (shouldShowNavbar) {
        // Wait for auth service to be ready
        const initNavbar = () => {
            if (window.authService && window.authService.isInitialized) {
                window.navbarComponent.init();
                
                // Set user when auth state changes
                window.authService.onAuthStateChange((user) => {
                    if (user) {
                        window.navbarComponent.setUser(user);
                        window.navbarComponent.loadCartCount();
                    }
                });
            } else {
                setTimeout(initNavbar, 100);
            }
        };
        
        initNavbar();
    }
});
