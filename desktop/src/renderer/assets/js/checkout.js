// Checkout Page Script
class CheckoutManager {
    constructor() {
        this.currentUser = null;
        this.cartItems = [];
        this.cartProducts = [];
        this.currentStep = 1;
        this.shippingData = {};
        this.savedOrder = null;
        this.isLoading = false;
        this.subtotal = 0;
        this.total = 0;
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize checkout
        this.bindEvents();
        this.addCheckoutStyles();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadCheckout();
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
        // Step navigation buttons
        const continueToReview = document.getElementById('continueToReview');
        const backToShipping = document.getElementById('backToShipping');
        const backToReview = document.getElementById('backToReview');
        
        if (continueToReview) continueToReview.addEventListener('click', () => this.goToStep2());
        if (backToShipping) backToShipping.addEventListener('click', () => this.goToStep1());
        if (backToReview) backToReview.addEventListener('click', () => this.goToStep2());

        // Action buttons
        const saveOrder = document.getElementById('saveOrder');
        const payNowBtn = document.getElementById('payNowBtn');
        const payLaterBtn = document.getElementById('payLaterBtn');
        const viewOrders = document.getElementById('viewOrders');

        if (saveOrder) saveOrder.addEventListener('click', () => this.saveOrder());
        if (payNowBtn) payNowBtn.addEventListener('click', () => this.payNow());
        if (payLaterBtn) payLaterBtn.addEventListener('click', () => this.payLater());
        if (viewOrders) viewOrders.addEventListener('click', () => this.viewOrders());

        // Form validation
        this.bindFormValidation();

        // Confirmation modal
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        
        if (confirmYes) confirmYes.addEventListener('click', () => this.executeConfirmedAction());
        if (confirmNo) confirmNo.addEventListener('click', () => this.hideModal());
    }

    bindFormValidation() {
        const form = document.getElementById('shippingForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const errorElement = document.getElementById(fieldName + 'Error');
        
        let errorMessage = '';

        switch (fieldName) {
            case 'phoneNumber':
                if (!value) {
                    errorMessage = 'Phone number is required';
                } else if (!/^[+][0-9\s\-\(\)]{10,}$/.test(value)) {
                    errorMessage = 'Please enter a valid phone number with country code';
                }
                break;
            case 'street':
                if (!value) {
                    errorMessage = 'Street address is required';
                } else if (value.length < 5) {
                    errorMessage = 'Please enter a complete street address';
                }
                break;
            case 'city':
                if (!value) {
                    errorMessage = 'City is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMessage = 'City should contain only letters';
                }
                break;
            case 'state':
                if (!value) {
                    errorMessage = 'State is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMessage = 'State should contain only letters';
                }
                break;
            case 'zipCode':
                if (!value) {
                    errorMessage = 'ZIP code is required';
                } else if (!/^[0-9]{6}$/.test(value)) {
                    errorMessage = 'Please enter a valid 6-digit ZIP code';
                }
                break;
            case 'country':
                if (!value) {
                    errorMessage = 'Country is required';
                }
                break;
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        field.classList.toggle('error', !!errorMessage);
        return !errorMessage;
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        field.classList.remove('error');
    }

    validateForm() {
        const form = document.getElementById('shippingForm');
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async loadCheckout() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Get cart items from API
            const cartData = await window.apiService.getCartItems(this.currentUser.uid);
            this.cartItems = cartData.cart?.items || [];

            if (this.cartItems.length === 0) {
                this.showEmptyCheckout();
                return;
            }

            // Load product details for each cart item
            await this.loadProductDetails();
            
            // Calculate totals
            this.calculateTotals();
            
            // Update UI
            this.updateOrderSummary();
            this.showCheckoutContent();

        } catch (error) {
            console.error('Failed to load checkout:', error);
            this.showMessage('Failed to load checkout. Please try again.', 'error');
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

    calculateTotals() {
        this.subtotal = this.cartProducts.reduce((sum, product) => {
            return sum + (parseFloat(product.price || 0) * product.quantity);
        }, 0);

        this.total = this.subtotal; // No additional fees for now

        // Calculate eco points (1 point per ₹10 spent)
        this.ecoPoints = Math.floor(this.total / 10);
    }

    updateOrderSummary() {
        const itemCount = this.cartProducts.reduce((sum, product) => sum + product.quantity, 0);
        
        // Update summary
        const itemCountEl = document.getElementById('itemCount');
        const subtotalEl = document.getElementById('subtotalAmount');
        const totalEl = document.getElementById('totalAmount');
        const ecoPointsEl = document.getElementById('ecoPoints');

        if (itemCountEl) itemCountEl.textContent = itemCount;
        if (subtotalEl) subtotalEl.textContent = `₹${this.subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `₹${this.total.toFixed(2)}`;
        if (ecoPointsEl) ecoPointsEl.textContent = `+${this.ecoPoints}`;
    }

    goToStep1() {
        this.currentStep = 1;
        this.updateStepVisibility();
        this.updateStepIndicator();
    }

    goToStep2() {
        if (this.currentStep === 1) {
            // Validate shipping form before proceeding
            if (!this.validateForm()) {
                this.showMessage('Please fill in all required fields correctly.', 'error');
                return;
            }
            
            // Collect shipping data
            this.collectShippingData();
        }

        this.currentStep = 2;
        this.updateStepVisibility();
        this.updateStepIndicator();
        
        // Load order review
        this.loadOrderReview();
    }

    goToStep3() {
        this.currentStep = 3;
        this.updateStepVisibility();
        this.updateStepIndicator();
    }

    updateStepVisibility() {
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.toggle('active', i === this.currentStep);
            }
        }
    }

    updateStepIndicator() {
        const steps = document.querySelectorAll('.checkout-steps .step');
        steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
            step.classList.toggle('completed', index + 1 < this.currentStep);
        });
    }

    collectShippingData() {
        const form = document.getElementById('shippingForm');
        if (!form) return;

        const formData = new FormData(form);
        this.shippingData = {
            phoneNumber: formData.get('phoneNumber'),
            shippingAddress: {
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state'),
                zipCode: formData.get('zipCode'),
                country: formData.get('country')
            },
            notes: formData.get('notes') || ''
        };
    }

    loadOrderReview() {
        // Load order items
        this.renderOrderItems();
        
        // Load shipping summary
        this.renderShippingSummary();
    }

    renderOrderItems() {
        const orderItemsList = document.getElementById('orderItemsList');
        if (!orderItemsList) return;

        const itemsHTML = this.cartProducts.map(product => {
            const price = parseFloat(product.price || 0);
            const itemTotal = price * product.quantity;
            const imageUrl = product.image || 'https://via.placeholder.com/80x80?text=Product';

            return `
                <div class="order-item">
                    <div class="item-image">
                        <img src="${imageUrl}" alt="${product.title}" loading="lazy">
                    </div>
                    <div class="item-details">
                        <h4 class="item-title">${product.title}</h4>
                        <p class="item-category">${product.category}</p>
                        <div class="item-price">₹${price.toFixed(2)} × ${product.quantity}</div>
                    </div>
                    <div class="item-total">₹${itemTotal.toFixed(2)}</div>
                </div>
            `;
        }).join('');

        orderItemsList.innerHTML = itemsHTML;
    }

    renderShippingSummary() {
        const shippingSummary = document.getElementById('shippingSummary');
        if (!shippingSummary || !this.shippingData.shippingAddress) return;

        const address = this.shippingData.shippingAddress;
        const summaryHTML = `
            <div class="shipping-info">
                <div class="shipping-row">
                    <strong>Phone:</strong> ${this.shippingData.phoneNumber}
                </div>
                <div class="shipping-row">
                    <strong>Address:</strong> ${address.street}
                </div>
                <div class="shipping-row">
                    <strong>City:</strong> ${address.city}, ${address.state}
                </div>
                <div class="shipping-row">
                    <strong>ZIP:</strong> ${address.zipCode}, ${address.country}
                </div>
                ${this.shippingData.notes ? `
                    <div class="shipping-row">
                        <strong>Notes:</strong> ${this.shippingData.notes}
                    </div>
                ` : ''}
            </div>
        `;

        shippingSummary.innerHTML = summaryHTML;
    }

    async saveOrder() {
        if (!this.shippingData.shippingAddress) {
            this.showMessage('Please complete shipping information first.', 'error');
            this.goToStep1();
            return;
        }

        this.setLoadingState('saveOrder', true);

        try {
            // Prepare order data
            const orderData = {
                buyerId: this.currentUser.uid,
                shippingAddress: this.shippingData.shippingAddress,
                phoneNumber: this.shippingData.phoneNumber,
                notes: this.shippingData.notes
            };

            // Save order via API
            const response = await window.apiService.saveOrderFromCart(orderData);
            this.savedOrder = response.order;

            // Update UI with saved order info
            this.updateSavedOrderInfo();

            // Move to payment step
            this.goToStep3();

            this.showMessage('Order saved successfully!', 'success');

        } catch (error) {
            console.error('Failed to save order:', error);
            this.showMessage('Failed to save order. Please try again.', 'error');
        } finally {
            this.setLoadingState('saveOrder', false);
        }
    }

    updateSavedOrderInfo() {
        if (!this.savedOrder) return;

        const orderIdEl = document.getElementById('savedOrderId');
        const orderTotalEl = document.getElementById('savedOrderTotal');

        if (orderIdEl) orderIdEl.textContent = this.savedOrder._id;
        if (orderTotalEl) orderTotalEl.textContent = `₹${this.savedOrder.totalAmount?.toFixed(2)}`;
    }

    async payNow() {
        if (!this.savedOrder) {
            this.showMessage('Please save the order first.', 'error');
            return;
        }

        this.setLoadingState('payNowBtn', true);

        try {
            // Mark order as ready for payment
            await window.apiService.markOrderForCheckout(this.savedOrder._id);

            // Open web payment gateway
            const paymentUrl = `http://localhost:3000/payment/${this.savedOrder._id}?buyerId=${this.currentUser.uid}`;
            
            // Open in external browser (Electron)
            if (window.require) {
                const { shell } = window.require('electron');
                shell.openExternal(paymentUrl);
            } else {
                // Fallback for testing
                window.open(paymentUrl, '_blank');
            }

            this.showMessage('Opening payment gateway...', 'info');

            // Optional: Start polling for payment status
            this.startPaymentStatusPolling();

        } catch (error) {
            console.error('Failed to initiate payment:', error);
            this.showMessage('Failed to open payment gateway. Please try again.', 'error');
        } finally {
            this.setLoadingState('payNowBtn', false);
        }
    }

    payLater() {
        this.showMessage('Order saved! You can complete payment later from My Orders.', 'info');
        setTimeout(() => {
            window.location.href = 'product-orders.html';
        }, 2000);
    }

    viewOrders() {
        window.location.href = 'product-orders.html';
    }

    async startPaymentStatusPolling() {
        if (!this.savedOrder) return;

        let attempts = 0;
        const maxAttempts = 60; // Poll for 5 minutes (60 * 5 seconds)

        const pollInterval = setInterval(async () => {
            attempts++;

            try {
                const response = await window.apiService.getOrderById(this.savedOrder._id);
                const order = response.order;

                if (order.paymentStatus === 'paid') {
                    clearInterval(pollInterval);
                    this.showMessage('Payment completed successfully! 🎉', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'product-orders.html';
                    }, 2000);
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    this.showMessage('Payment status check timed out. Check My Orders for updates.', 'warning');
                }

            } catch (error) {
                console.error('Failed to check payment status:', error);
                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                }
            }
        }, 5000); // Check every 5 seconds
    }

    showCheckoutContent() {
        const checkoutContent = document.getElementById('checkoutContent');
        const emptyCheckout = document.getElementById('emptyCheckout');
        
        if (checkoutContent) checkoutContent.classList.remove('hidden');
        if (emptyCheckout) emptyCheckout.classList.add('hidden');
    }

    showEmptyCheckout() {
        const checkoutContent = document.getElementById('checkoutContent');
        const emptyCheckout = document.getElementById('emptyCheckout');
        
        if (checkoutContent) checkoutContent.classList.add('hidden');
        if (emptyCheckout) emptyCheckout.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('checkoutLoading');
        const checkoutContent = document.getElementById('checkoutContent');
        const emptyCheckout = document.getElementById('emptyCheckout');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (checkoutContent) checkoutContent.classList.add('hidden');
            if (emptyCheckout) emptyCheckout.classList.add('hidden');
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
        // Use navbar component message system if available
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        
        if (titleEl) titleEl.textContent = title;
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

    addCheckoutStyles() {
        const styleId = 'checkout-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .checkout-container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .checkout-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .checkout-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .checkout-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }

                .checkout-steps {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    opacity: 0.5;
                    transition: opacity 0.3s;
                }

                .step.active, .step.completed {
                    opacity: 1;
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #e0e0e0;
                    color: #666;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    transition: all 0.3s;
                }

                .step.active .step-number {
                    background: #4CAF50;
                    color: white;
                }

                .step.completed .step-number {
                    background: #2196F3;
                    color: white;
                }

                .step-label {
                    font-size: 0.9rem;
                    color: #666;
                    font-weight: 500;
                }

                .checkout-content {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    align-items: start;
                }

                .checkout-step {
                    display: none;
                }

                .checkout-step.active {
                    display: block;
                }

                .step-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .step-content h2 {
                    color: #333;
                    margin: 0 0 1.5rem 0;
                    font-size: 1.5rem;
                }

                .shipping-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group label {
                    font-weight: 500;
                    color: #333;
                    font-size: 0.9rem;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: border-color 0.3s;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #4CAF50;
                }

                .form-group input.error {
                    border-color: #f44336;
                }

                .form-error {
                    color: #f44336;
                    font-size: 0.8rem;
                    display: none;
                }

                .step-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0e0;
                }

                .order-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .order-item {
                    display: grid;
                    grid-template-columns: 80px 1fr auto;
                    gap: 1rem;
                    align-items: center;
                    padding: 1rem;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                }

                .order-item .item-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .order-item .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .order-item .item-title {
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                    color: #333;
                }

                .order-item .item-category {
                    background: #e8f5e8;
                    color: #4CAF50;
                    padding: 0.2rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    display: inline-block;
                    margin-bottom: 0.25rem;
                }

                .order-item .item-price {
                    color: #666;
                    font-size: 0.9rem;
                }

                .order-item .item-total {
                    font-weight: bold;
                    color: #4CAF50;
                    font-size: 1.1rem;
                }

                .shipping-summary h3 {
                    color: #333;
                    margin: 0 0 1rem 0;
                }

                .shipping-info {
                    background: #f9f9f9;
                    padding: 1rem;
                    border-radius: 8px;
                    border-left: 4px solid #4CAF50;
                }

                .shipping-row {
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .success-message {
                    text-align: center;
                    padding: 2rem;
                    background: #e8f5e8;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    border: 2px solid #4CAF50;
                }

                .success-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .success-message h3 {
                    color: #4CAF50;
                    margin: 0 0 0.5rem 0;
                }

                .success-message p {
                    color: #333;
                    margin: 0 0 1rem 0;
                }

                .order-details {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                }

                .order-details p {
                    margin: 0.25rem 0;
                    color: #333;
                }

                .payment-note {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: #e3f2fd;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    border-left: 4px solid #2196F3;
                }

                .payment-note-icon {
                    font-size: 1.5rem;
                    color: #2196F3;
                }

                .payment-note-content h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2196F3;
                }

                .payment-note-content p {
                    margin: 0;
                    color: #333;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .payment-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .payment-btn {
                    font-size: 1.1rem;
                    padding: 1rem;
                    font-weight: bold;
                }

                .payment-security {
                    text-align: center;
                    margin-top: 1rem;
                }

                .security-badges {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .security-badge {
                    background: #f5f5f5;
                    color: #666;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    border: 1px solid #e0e0e0;
                }

                .order-summary-sidebar {
                    height: fit-content;
                    position: sticky;
                    top: 2rem;
                }

                .summary-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .summary-card h3 {
                    color: #333;
                    margin: 0 0 1rem 0;
                    text-align: center;
                }

                .summary-items {
                    margin-bottom: 1.5rem;
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
                    border-top: 1px solid #e0e0e0;
                    padding-top: 0.5rem;
                    margin-top: 1rem;
                }

                .summary-row.eco-row {
                    color: #4CAF50;
                }

                .summary-divider {
                    height: 1px;
                    background: #e0e0e0;
                    margin: 1rem 0;
                }

                .free-shipping {
                    color: #4CAF50;
                    font-weight: 500;
                }

                .eco-bonus {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .eco-impact-summary {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #e8f5e8;
                    border-radius: 8px;
                    margin-top: 1rem;
                }

                .eco-impact-icon {
                    font-size: 1.5rem;
                    color: #4CAF50;
                }

                .eco-impact-content h4 {
                    margin: 0 0 0.5rem 0;
                    color: #4CAF50;
                    font-size: 0.9rem;
                }

                .eco-impact-content p {
                    margin: 0;
                    color: #333;
                    font-size: 0.8rem;
                    line-height: 1.3;
                }

                .empty-checkout {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .empty-checkout-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-checkout h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .empty-checkout p {
                    color: #666;
                    margin-bottom: 2rem;
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
                    .checkout-content {
                        grid-template-columns: 1fr;
                    }

                    .order-summary-sidebar {
                        order: -1;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .checkout-steps {
                        gap: 1rem;
                    }

                    .step-label {
                        font-size: 0.8rem;
                    }

                    .security-badges {
                        gap: 0.5rem;
                    }

                    .step-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const checkoutManager = new CheckoutManager();
    checkoutManager.init().catch(error => {
        console.error('Failed to initialize checkout:', error);
    });
});
