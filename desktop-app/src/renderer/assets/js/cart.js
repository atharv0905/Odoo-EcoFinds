// Cart Page Script
class CartManager {
    constructor() {
        this.currentUser = null;
        this.cartItems = [];
        this.cartProducts = [];
        this.isLoading = false;
        this.subtotal = 0;
        this.total = 0;
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize cart
        this.bindEvents();
        this.addCartStyles();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadCart();
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
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }

        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.confirmClearCart());
        }

        // Confirmation modal
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        
        if (confirmYes) confirmYes.addEventListener('click', () => this.executeConfirmedAction());
        if (confirmNo) confirmNo.addEventListener('click', () => this.hideModal());
    }

    async loadCart() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Get cart items from API
            const cartData = await window.apiService.getCartItems(this.currentUser.uid);
            this.cartItems = cartData.cart?.items || [];

            if (this.cartItems.length === 0) {
                this.showEmptyCart();
                return;
            }

            // Load product details for each cart item
            await this.loadProductDetails();
            
            // Render cart
            this.renderCart();
            this.calculateTotals();
            this.showCartContent();

        } catch (error) {
            console.error('Failed to load cart:', error);
            this.showMessage('Failed to load cart. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async loadProductDetails() {
        this.cartProducts = [];
        
        for (const item of this.cartItems) {
            try {
                const productData = await window.apiService.getProductById(item.productId);
                this.cartProducts.push({
                    ...productData.product,
                    quantity: item.quantity
                });
            } catch (error) {
                console.error(`Failed to load product ${item.productId}:`, error);
            }
        }
    }

    renderCart() {
        const cartItemsList = document.getElementById('cartItemsList');
        const cartItemCount = document.getElementById('cartItemCount');
        
        if (!cartItemsList) return;

        // Update item count
        const totalItems = this.cartProducts.reduce((sum, product) => sum + product.quantity, 0);
        if (cartItemCount) {
            cartItemCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        }

        // Render cart items
        const cartHTML = this.cartProducts.map(product => this.createCartItemHTML(product)).join('');
        cartItemsList.innerHTML = cartHTML;

        // Bind cart item events
        this.bindCartItemEvents();
    }

    createCartItemHTML(product) {
        const price = parseFloat(product.price || 0);
        const itemTotal = price * product.quantity;
        const imageUrl = product.image || 'https://via.placeholder.com/150x150?text=Product';
        
        // Check stock availability
        const stock = product.stock || 0;
        const isLowStock = stock <= 5 && stock > 0;
        const isOutOfStock = stock === 0;
        const maxQuantity = Math.min(product.quantity, stock);
        
        // Check if user is trying to buy their own product
        const isOwnProduct = product.createdBy === this.currentUser.uid;

        return `
            <div class="cart-item ${isOutOfStock ? 'out-of-stock' : ''} ${isOwnProduct ? 'own-product' : ''}" data-product-id="${product._id}">
                <div class="item-image">
                    <img src="${imageUrl}" alt="${product.title}" loading="lazy">
                    ${isOutOfStock ? '<div class="stock-badge out-of-stock">Out of Stock</div>' : ''}
                    ${isLowStock ? '<div class="stock-badge low-stock">Low Stock</div>' : ''}
                    ${isOwnProduct ? '<div class="stock-badge own-product">Your Product</div>' : ''}
                </div>
                
                <div class="item-details">
                    <h3 class="item-title">${product.title}</h3>
                    <p class="item-description">${this.truncateText(product.description, 80)}</p>
                    <div class="item-category">${product.category}</div>
                    <div class="item-price">$${price.toFixed(2)} each</div>
                    <div class="item-stock">
                        Stock: <span class="stock-count ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'good'}">${stock}</span>
                    </div>
                    ${isOwnProduct ? '<div class="own-product-warning">⚠️ This is your own product</div>' : ''}
                </div>
                
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus-btn" data-product-id="${product._id}" ${isOutOfStock || isOwnProduct ? 'disabled' : ''}>-</button>
                        <span class="quantity-display">${product.quantity}</span>
                        <button class="quantity-btn plus-btn" data-product-id="${product._id}" ${isOutOfStock || product.quantity >= stock || isOwnProduct ? 'disabled' : ''}>+</button>
                    </div>
                    
                    <div class="item-total">$${itemTotal.toFixed(2)}</div>
                    
                    <button class="remove-btn" data-product-id="${product._id}" title="Remove from cart">
                        🗑️
                    </button>
                </div>
                
                ${isOutOfStock ? '<div class="item-warning">This item is out of stock and will be removed during checkout.</div>' : ''}
                ${isOwnProduct ? '<div class="item-warning">You cannot purchase your own products.</div>' : ''}
                ${product.quantity > stock && stock > 0 ? `<div class="item-warning">Only ${stock} items available. Quantity will be adjusted.</div>` : ''}
            </div>
        `;
    }

    bindCartItemEvents() {
        // Quantity buttons
        const minusBtns = document.querySelectorAll('.minus-btn');
        const plusBtns = document.querySelectorAll('.plus-btn');
        const removeBtns = document.querySelectorAll('.remove-btn');

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                this.updateQuantity(productId, -1);
            });
        });

        plusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                this.updateQuantity(productId, 1);
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                this.confirmRemoveItem(productId);
            });
        });
    }

    async updateQuantity(productId, change) {
        const product = this.cartProducts.find(p => p._id === productId);
        if (!product) return;

        const newQuantity = product.quantity + change;
        
        if (newQuantity <= 0) {
            this.confirmRemoveItem(productId);
            return;
        }

        try {
            // Update quantity in backend by removing and re-adding
            await window.apiService.removeFromCart(this.currentUser.uid, productId);
            await window.apiService.addToCart(this.currentUser.uid, productId, newQuantity);
            
            // Reload cart
            await this.loadCart();
            
            // Update navbar cart count
            if (window.navbarComponent) {
                await window.navbarComponent.loadCartCount();
            }

        } catch (error) {
            console.error('Failed to update quantity:', error);
            this.showMessage('Failed to update quantity. Please try again.', 'error');
        }
    }

    confirmRemoveItem(productId) {
        const product = this.cartProducts.find(p => p._id === productId);
        if (!product) return;

        this.showConfirmModal(
            `Remove "${product.title}" from your cart?`,
            () => this.removeItem(productId)
        );
    }

    async removeItem(productId) {
        try {
            await window.apiService.removeFromCart(this.currentUser.uid, productId);
            
            // Reload cart
            await this.loadCart();
            
            // Update navbar cart count
            if (window.navbarComponent) {
                await window.navbarComponent.loadCartCount();
            }

            this.showMessage('Item removed from cart', 'success');

        } catch (error) {
            console.error('Failed to remove item:', error);
            this.showMessage('Failed to remove item. Please try again.', 'error');
        }
    }

    confirmClearCart() {
        if (this.cartProducts.length === 0) return;

        this.showConfirmModal(
            'Clear all items from your cart?',
            () => this.clearCart()
        );
    }

    async clearCart() {
        try {
            // Remove each item from cart
            for (const product of this.cartProducts) {
                await window.apiService.removeFromCart(this.currentUser.uid, product._id);
            }
            
            // Reload cart
            await this.loadCart();
            
            // Update navbar cart count
            if (window.navbarComponent) {
                await window.navbarComponent.loadCartCount();
            }

            this.showMessage('Cart cleared', 'success');

        } catch (error) {
            console.error('Failed to clear cart:', error);
            this.showMessage('Failed to clear cart. Please try again.', 'error');
        }
    }

    calculateTotals() {
        this.subtotal = this.cartProducts.reduce((sum, product) => {
            return sum + (parseFloat(product.price || 0) * product.quantity);
        }, 0);

        this.total = this.subtotal; // No additional fees for now

        // Update UI
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${this.subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${this.total.toFixed(2)}`;
    }

    async checkout() {
        if (this.cartProducts.length === 0) {
            this.showMessage('Your cart is empty', 'warning');
            return;
        }

        this.setLoadingState('checkoutBtn', true);

        try {
            // Create product orders for each item in cart
            const orderPromises = this.cartProducts.map(async (product) => {
                const orderData = {
                    productId: product._id,
                    sellerId: product.createdBy,
                    buyerId: this.currentUser.uid,
                    quantity: product.quantity,
                    shippingAddress: {
                        street: '123 Main St', // In a real app, this would be from user profile or form
                        city: 'Anytown',
                        state: 'AS',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    notes: `Order placed from cart checkout`
                };
                
                return await window.apiService.createProductOrder(orderData);
            });

            await Promise.all(orderPromises);

            // Create purchase record for user's purchase history
            const productIds = this.cartProducts.map(p => p._id);
            await window.apiService.createPurchase(this.currentUser.uid, productIds);

            // Clear cart after successful purchase
            await this.clearCart();

            // Show success message
            this.showMessage('Purchase completed successfully! 🎉', 'success');

            // Update navbar cart count
            if (window.navbarComponent) {
                await window.navbarComponent.loadCartCount();
            }

            // Redirect to purchases page after a delay
            setTimeout(() => {
                window.location.href = 'purchases.html';
            }, 2000);

        } catch (error) {
            console.error('Checkout failed:', error);
            if (error.message.includes('Insufficient stock')) {
                this.showMessage('Some items are out of stock. Please update your cart.', 'error');
                // Reload cart to reflect current stock levels
                await this.loadCart();
            } else if (error.message.includes('Cannot buy your own product')) {
                this.showMessage('Cannot purchase your own products. Please remove them from cart.', 'error');
            } else {
                this.showMessage('Checkout failed. Please try again.', 'error');
            }
        } finally {
            this.setLoadingState('checkoutBtn', false);
        }
    }

    showCartContent() {
        const cartContent = document.getElementById('cartContent');
        const emptyCart = document.getElementById('emptyCart');
        
        if (cartContent) cartContent.classList.remove('hidden');
        if (emptyCart) emptyCart.classList.add('hidden');
    }

    showEmptyCart() {
        const cartContent = document.getElementById('cartContent');
        const emptyCart = document.getElementById('emptyCart');
        
        if (cartContent) cartContent.classList.add('hidden');
        if (emptyCart) emptyCart.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('cartLoading');
        const cartContent = document.getElementById('cartContent');
        const emptyCart = document.getElementById('emptyCart');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (cartContent) cartContent.classList.add('hidden');
            if (emptyCart) emptyCart.classList.add('hidden');
        } else {
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        
        if (messageEl) messageEl.textContent = message;
        if (modal) modal.classList.remove('hidden');
        
        this.pendingAction = onConfirm;
    }

    hideModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.add('hidden');
        this.pendingAction = null;
    }

    executeConfirmedAction() {
        if (this.pendingAction) {
            this.pendingAction();
        }
        this.hideModal();
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
        // Use navbar component message system if available
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

    addCartStyles() {
        const styleId = 'cart-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .cart-container {
                    max-width: 1000px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .cart-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .cart-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .cart-subtitle {
                    color: #666;
                    font-size: 1.1rem;
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

                .cart-content {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                }

                .cart-items-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e0e0e0;
                }

                .cart-items-header h2 {
                    color: #333;
                    margin: 0;
                }

                .item-count {
                    color: #666;
                    font-weight: 500;
                }

                .cart-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .cart-item {
                    display: grid;
                    grid-template-columns: 150px 1fr auto;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    align-items: flex-start;
                    position: relative;
                }

                .cart-item.out-of-stock {
                    opacity: 0.7;
                    background: #f5f5f5;
                }

                .cart-item.own-product {
                    border-left: 4px solid #ff9800;
                    background: #fff8e1;
                }

                .item-image {
                    width: 150px;
                    height: 150px;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }

                .stock-badge {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: white;
                }

                .stock-badge.out-of-stock {
                    background: #f44336;
                }

                .stock-badge.low-stock {
                    background: #ff9800;
                }

                .stock-badge.own-product {
                    background: #9c27b0;
                }

                .item-stock {
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }

                .stock-count.good {
                    color: #4caf50;
                }

                .stock-count.low {
                    color: #ff9800;
                }

                .stock-count.out {
                    color: #f44336;
                }

                .own-product-warning {
                    color: #ff9800;
                    font-size: 0.8rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }

                .item-warning {
                    grid-column: 1 / -1;
                    background: #fff3e0;
                    color: #f57c00;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin-top: 0.5rem;
                    border-left: 3px solid #ff9800;
                }

                .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .item-details {
                    flex: 1;
                }

                .item-title {
                    color: #333;
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                }

                .item-description {
                    color: #666;
                    margin: 0 0 0.5rem 0;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .item-category {
                    background: #e8f5e8;
                    color: #4CAF50;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    display: inline-block;
                    margin-bottom: 0.5rem;
                }

                .item-price {
                    color: #4CAF50;
                    font-weight: bold;
                    font-size: 1rem;
                }

                .item-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f5f5f5;
                    border-radius: 20px;
                    padding: 0.25rem;
                }

                .quantity-btn {
                    width: 30px;
                    height: 30px;
                    border: none;
                    background: #4CAF50;
                    color: white;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    transition: background 0.3s;
                }

                .quantity-btn:hover {
                    background: #45a049;
                }

                .quantity-display {
                    min-width: 30px;
                    text-align: center;
                    font-weight: bold;
                }

                .item-total {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #333;
                }

                .remove-btn {
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .remove-btn:hover {
                    background: #cc0000;
                }

                .summary-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    height: fit-content;
                }

                .summary-card h3 {
                    color: #333;
                    margin: 0 0 1rem 0;
                    text-align: center;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    color: #666;
                }

                .summary-row.total-row {
                    font-weight: bold;
                    color: #333;
                    font-size: 1.1rem;
                }

                .summary-divider {
                    height: 1px;
                    background: #e0e0e0;
                    margin: 1rem 0;
                }

                .eco-bonus {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .cart-actions {
                    margin: 1.5rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .checkout-btn {
                    font-size: 1.1rem;
                    padding: 0.75rem;
                    font-weight: bold;
                }

                .clear-btn {
                    background: #ff6b6b;
                    border: none;
                }

                .clear-btn:hover {
                    background: #ee5a5a;
                }

                .eco-impact {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #e8f5e8;
                    border-radius: 8px;
                    margin-top: 1rem;
                }

                .eco-impact-icon {
                    font-size: 2rem;
                    color: #4CAF50;
                }

                .eco-impact-content h4 {
                    margin: 0 0 0.5rem 0;
                    color: #4CAF50;
                }

                .eco-impact-content p {
                    margin: 0;
                    color: #333;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .empty-cart {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .empty-cart-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-cart h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .empty-cart p {
                    color: #666;
                    margin-bottom: 2rem;
                }

                .continue-shopping {
                    text-align: center;
                    margin-top: 2rem;
                }

                .continue-link {
                    color: #4CAF50;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s;
                }

                .continue-link:hover {
                    color: #45a049;
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

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                }

                .modal-content h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                }

                .modal-content p {
                    margin: 0 0 1.5rem 0;
                    color: #666;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                @media (max-width: 768px) {
                    .cart-content {
                        grid-template-columns: 1fr;
                    }

                    .cart-item {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }

                    .item-actions {
                        flex-direction: row;
                        justify-content: space-between;
                        width: 100%;
                    }

                    .cart-container {
                        padding: 0 0.5rem;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cartManager = new CartManager();
    cartManager.init().catch(error => {
        console.error('Failed to initialize cart:', error);
    });
});
