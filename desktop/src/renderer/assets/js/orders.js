// Orders Page Script
class OrdersManager {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.filteredOrders = [];
        this.currentFilter = 'all';
        this.isLoading = false;
        this.selectedOrder = null;
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize orders
        this.bindEvents();
        this.addOrderStyles();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadOrders();
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
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const status = e.target.getAttribute('data-status');
                this.setFilter(status);
            });
        });

        // Modal events
        const closeModal = document.getElementById('closeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const payOrderBtn = document.getElementById('payOrderBtn');
        const cancelOrderBtn = document.getElementById('cancelOrderBtn');

        if (closeModal) closeModal.addEventListener('click', () => this.hideOrderModal());
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.hideOrderModal());
        if (payOrderBtn) payOrderBtn.addEventListener('click', () => this.payOrder());
        if (cancelOrderBtn) cancelOrderBtn.addEventListener('click', () => this.confirmCancelOrder());

        // Confirmation modal
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        
        if (confirmYes) confirmYes.addEventListener('click', () => this.executeConfirmedAction());
        if (confirmNo) confirmNo.addEventListener('click', () => this.hideConfirmModal());
    }

    async loadOrders() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Get orders from API
            const response = await window.apiService.getBuyerOrders(this.currentUser.uid);
            this.orders = response.orders || [];

            if (this.orders.length === 0) {
                this.showEmptyOrders();
                return;
            }

            // Apply current filter
            this.applyFilter();
            
            // Render orders
            this.renderOrders();
            this.showOrdersContent();

        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showMessage('Failed to load orders. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    setFilter(status) {
        this.currentFilter = status;
        
        // Update active tab
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-status') === status);
        });

        // Apply filter and render
        this.applyFilter();
        this.renderOrders();
    }

    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
        }
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (this.filteredOrders.length === 0) {
            ordersList.innerHTML = '<div class="no-orders-message">No orders found for the selected filter.</div>';
            return;
        }

        const ordersHTML = this.filteredOrders.map(order => this.createOrderHTML(order)).join('');
        ordersList.innerHTML = ordersHTML;

        // Bind order events
        this.bindOrderEvents();
    }

    createOrderHTML(order) {
        const orderDate = new Date(order.orderDate || order.createdAt).toLocaleDateString();
        const totalAmount = order.totalAmount || 0;
        
        // Get status info
        const statusInfo = this.getStatusInfo(order.status);
        const paymentStatusInfo = this.getPaymentStatusInfo(order.paymentStatus);
        
        // Check order conditions for different actions
        const isDraft = order.status === 'draft';
        const isUnpaid = order.paymentStatus === 'unpaid' && order.status === 'pending_payment';
        const canCancel = ['draft', 'pending_payment', 'paid', 'processing'].includes(order.status);

        return `
            <div class="order-card" data-order-id="${order._id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3 class="order-id">Order #${order._id.slice(-8)}</h3>
                        <p class="order-date">Placed on ${orderDate}</p>
                    </div>
                    <div class="order-amount">
                        <span class="amount">₹${totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="order-status">
                    <div class="status-badges">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        <span class="payment-badge ${paymentStatusInfo.class}">${paymentStatusInfo.text}</span>
                    </div>
                </div>

                <div class="order-summary">
                    <div class="shipping-info">
                        <span class="shipping-icon">📍</span>
                        <span class="shipping-text">
                            ${order.shippingAddress?.city}, ${order.shippingAddress?.state}
                        </span>
                    </div>
                    <div class="order-phone">
                        <span class="phone-icon">📞</span>
                        <span class="phone-text">${order.phoneNumber}</span>
                    </div>
                </div>

                <div class="order-actions">
                    <button class="btn btn-outline view-details-btn" data-order-id="${order._id}">
                        View Details
                    </button>
                    
                    ${isDraft ? `
                        <button class="btn btn-success save-order-btn" data-order-id="${order._id}">
                            <span class="btn-icon">💾</span>
                            Save Order
                        </button>
                    ` : ''}
                    
                    ${isUnpaid ? `
                        <button class="btn btn-primary pay-order-btn" data-order-id="${order._id}">
                            <span class="btn-icon">💳</span>
                            Pay for Order
                        </button>
                    ` : ''}
                    
                    ${canCancel ? `
                        <button class="btn btn-danger cancel-btn" data-order-id="${order._id}">
                            <span class="btn-icon">❌</span>
                            Cancel
                        </button>
                    ` : ''}
                </div>

                ${order.notes ? `
                    <div class="order-notes">
                        <strong>Notes:</strong> ${order.notes}
                    </div>
                ` : ''}

                ${isDraft ? `
                    <div class="order-hint">
                        <div class="hint-icon">💡</div>
                        <span class="hint-text">This order is in draft mode. Click "Save Order" to prepare it for payment.</span>
                    </div>
                ` : ''}

                ${isUnpaid ? `
                    <div class="order-hint payment-pending">
                        <div class="hint-icon">⏰</div>
                        <span class="hint-text">Payment is pending. Click "Pay for Order" to complete your purchase.</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStatusInfo(status) {
        const statusMap = {
            'draft': { text: 'Draft', class: 'status-draft' },
            'pending_payment': { text: 'Pending Payment', class: 'status-pending' },
            'paid': { text: 'Paid', class: 'status-paid' },
            'processing': { text: 'Processing', class: 'status-processing' },
            'shipped': { text: 'Shipped', class: 'status-shipped' },
            'delivered': { text: 'Delivered', class: 'status-delivered' },
            'cancelled': { text: 'Cancelled', class: 'status-cancelled' }
        };
        return statusMap[status] || { text: status, class: 'status-unknown' };
    }

    getPaymentStatusInfo(paymentStatus) {
        const statusMap = {
            'unpaid': { text: 'Unpaid', class: 'payment-unpaid' },
            'paid': { text: 'Paid', class: 'payment-paid' },
            'failed': { text: 'Failed', class: 'payment-failed' },
            'refunded': { text: 'Refunded', class: 'payment-refunded' }
        };
        return statusMap[paymentStatus] || { text: paymentStatus, class: 'payment-unknown' };
    }

    bindOrderEvents() {
        // View details buttons
        const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
        viewDetailsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.viewOrderDetails(orderId);
            });
        });

        // Save order buttons (for draft orders)
        const saveOrderBtns = document.querySelectorAll('.save-order-btn');
        saveOrderBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.saveOrderForPayment(orderId);
            });
        });

        // Pay for order buttons (for unpaid orders)
        const payOrderBtns = document.querySelectorAll('.pay-order-btn');
        payOrderBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.payOrderDirectly(orderId);
            });
        });

        // Cancel buttons
        const cancelBtns = document.querySelectorAll('.cancel-btn');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.selectedOrder = this.orders.find(o => o._id === orderId);
                this.confirmCancelOrder();
            });
        });
    }

    async viewOrderDetails(orderId) {
        try {
            // Find order in current list or fetch from API
            let order = this.orders.find(o => o._id === orderId);
            if (!order) {
                const response = await window.apiService.getOrderById(orderId);
                order = response.order;
            }

            this.selectedOrder = order;
            this.showOrderModal(order);

        } catch (error) {
            console.error('Failed to load order details:', error);
            this.showMessage('Failed to load order details.', 'error');
        }
    }

    showOrderModal(order) {
        const modal = document.getElementById('orderModal');
        const modalTitle = document.getElementById('modalOrderTitle');
        const modalContent = document.getElementById('modalOrderContent');
        const payOrderBtn = document.getElementById('payOrderBtn');
        const cancelOrderBtn = document.getElementById('cancelOrderBtn');

        if (!modal || !modalTitle || !modalContent) return;

        // Update modal title
        modalTitle.textContent = `Order #${order._id.slice(-8)}`;

        // Create order details HTML
        const orderDate = new Date(order.orderDate || order.createdAt).toLocaleString();
        const statusInfo = this.getStatusInfo(order.status);
        const paymentStatusInfo = this.getPaymentStatusInfo(order.paymentStatus);

        const detailsHTML = `
            <div class="order-details">
                <div class="order-detail-section">
                    <h4>Order Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span class="detail-value">${order._id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Date:</span>
                        <span class="detail-value">${orderDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Status:</span>
                        <span class="detail-value">
                            <span class="payment-badge ${paymentStatusInfo.class}">${paymentStatusInfo.text}</span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value total-amount">₹${order.totalAmount?.toFixed(2)}</span>
                    </div>
                </div>

                <div class="order-detail-section">
                    <h4>Shipping Information</h4>
                    <div class="shipping-details">
                        <p><strong>Phone:</strong> ${order.phoneNumber}</p>
                        <p><strong>Address:</strong></p>
                        <div class="address">
                            ${order.shippingAddress?.street}<br>
                            ${order.shippingAddress?.city}, ${order.shippingAddress?.state}<br>
                            ${order.shippingAddress?.zipCode}, ${order.shippingAddress?.country}
                        </div>
                    </div>
                </div>

                ${order.notes ? `
                    <div class="order-detail-section">
                        <h4>Special Instructions</h4>
                        <p class="order-notes-detail">${order.notes}</p>
                    </div>
                ` : ''}

                ${order.paymentId ? `
                    <div class="order-detail-section">
                        <h4>Payment Information</h4>
                        <div class="detail-row">
                            <span class="detail-label">Payment ID:</span>
                            <span class="detail-value">${order.paymentId}</span>
                        </div>
                        ${order.razorpayPaymentId ? `
                            <div class="detail-row">
                                <span class="detail-label">Razorpay Payment ID:</span>
                                <span class="detail-value">${order.razorpayPaymentId}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        modalContent.innerHTML = detailsHTML;

        // Show/hide action buttons
        const canPay = order.status === 'pending_payment' && order.paymentStatus === 'unpaid';
        const canCancel = ['draft', 'pending_payment', 'paid', 'processing'].includes(order.status);

        if (payOrderBtn) {
            payOrderBtn.classList.toggle('hidden', !canPay);
        }
        if (cancelOrderBtn) {
            cancelOrderBtn.classList.toggle('hidden', !canCancel);
        }

        // Show modal
        modal.classList.remove('hidden');
    }

    hideOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) modal.classList.add('hidden');
        this.selectedOrder = null;
    }

    async payOrder() {
        if (!this.selectedOrder) return;
        
        this.hideOrderModal();
        await this.payOrderDirectly(this.selectedOrder._id);
    }

    async saveOrderForPayment(orderId) {
        try {
            // Mark order as ready for payment (moves from draft to pending_payment)
            await window.apiService.markOrderForCheckout(orderId);
            
            this.showMessage('Order saved successfully! You can now proceed with payment.', 'success');
            
            // Reload orders to reflect the status change
            await this.loadOrders();

        } catch (error) {
            console.error('Failed to save order:', error);
            this.showMessage('Failed to save order. Please try again.', 'error');
        }
    }

    async payOrderDirectly(orderId) {
        try {
            // Ensure order is ready for payment
            const order = this.orders.find(o => o._id === orderId);
            if (order && order.status === 'draft') {
                await window.apiService.markOrderForCheckout(orderId);
            }

            // Open web payment gateway
            const paymentUrl = `http://localhost:3000/payment/${orderId}?buyerId=${this.currentUser.uid}`;
            
            // Open in external browser (Electron)
            if (window.require) {
                const { shell } = window.require('electron');
                shell.openExternal(paymentUrl);
            } else {
                // Fallback for testing
                window.open(paymentUrl, '_blank');
            }

            this.showMessage('Opening payment gateway...', 'info');

            // Start polling for payment status
            this.startPaymentStatusPolling(orderId);

        } catch (error) {
            console.error('Failed to initiate payment:', error);
            this.showMessage('Failed to open payment gateway. Please try again.', 'error');
        }
    }

    async startPaymentStatusPolling(orderId) {
        let attempts = 0;
        const maxAttempts = 60; // Poll for 5 minutes (60 * 5 seconds)

        const pollInterval = setInterval(async () => {
            attempts++;

            try {
                const response = await window.apiService.getOrderById(orderId);
                const order = response.order;

                if (order.paymentStatus === 'paid') {
                    clearInterval(pollInterval);
                    this.showMessage('Payment completed successfully! 🎉', 'success');
                    
                    // Reload orders to reflect payment status
                    await this.loadOrders();
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    this.showMessage('Payment status check timed out. Please refresh to see updates.', 'warning');
                }

            } catch (error) {
                console.error('Failed to check payment status:', error);
                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                }
            }
        }, 5000); // Check every 5 seconds
    }

    confirmCancelOrder() {
        if (!this.selectedOrder) return;

        this.showConfirmModal(
            'Cancel Order',
            `Are you sure you want to cancel order #${this.selectedOrder._id.slice(-8)}?`,
            () => this.cancelOrder()
        );
    }

    async cancelOrder() {
        if (!this.selectedOrder) return;

        try {
            await window.apiService.cancelOrderById(
                this.selectedOrder._id, 
                this.currentUser.uid, 
                'Cancelled by user'
            );

            this.showMessage('Order cancelled successfully.', 'success');
            
            // Reload orders to reflect changes
            await this.loadOrders();
            
            this.hideOrderModal();

        } catch (error) {
            console.error('Failed to cancel order:', error);
            this.showMessage('Failed to cancel order. Please try again.', 'error');
        }
    }

    showOrdersContent() {
        const ordersContent = document.getElementById('ordersContent');
        const emptyOrders = document.getElementById('emptyOrders');
        
        if (ordersContent) ordersContent.classList.remove('hidden');
        if (emptyOrders) emptyOrders.classList.add('hidden');
    }

    showEmptyOrders() {
        const ordersContent = document.getElementById('ordersContent');
        const emptyOrders = document.getElementById('emptyOrders');
        
        if (ordersContent) ordersContent.classList.add('hidden');
        if (emptyOrders) emptyOrders.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('ordersLoading');
        const ordersContent = document.getElementById('ordersContent');
        const emptyOrders = document.getElementById('emptyOrders');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (ordersContent) ordersContent.classList.add('hidden');
            if (emptyOrders) emptyOrders.classList.add('hidden');
        } else {
            if (loadingEl) loadingEl.classList.add('hidden');
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

    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.add('hidden');
        this.pendingAction = null;
    }

    executeConfirmedAction() {
        if (this.pendingAction) {
            this.pendingAction();
        }
        this.hideConfirmModal();
    }

    showMessage(message, type = 'info') {
        // Use navbar component message system if available
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    addOrderStyles() {
        const styleId = 'orders-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .orders-container {
                    max-width: 1000px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .orders-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .orders-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .orders-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }

                .order-filters {
                    margin-bottom: 2rem;
                }

                .filter-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .filter-tab {
                    padding: 0.5rem 1rem;
                    border: 2px solid #e0e0e0;
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                    color: #666;
                }

                .filter-tab:hover {
                    border-color: #4CAF50;
                    color: #4CAF50;
                }

                .filter-tab.active {
                    background: #4CAF50;
                    border-color: #4CAF50;
                    color: white;
                }

                .orders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .order-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-left: 4px solid #e0e0e0;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .order-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }

                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .order-info h3 {
                    margin: 0 0 0.25rem 0;
                    color: #333;
                    font-size: 1.1rem;
                }

                .order-date {
                    margin: 0;
                    color: #666;
                    font-size: 0.9rem;
                }

                .order-amount .amount {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #4CAF50;
                }

                .order-status {
                    margin-bottom: 1rem;
                }

                .status-badges {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .status-badge, .payment-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .status-draft { background: #f5f5f5; color: #666; }
                .status-pending { background: #fff3e0; color: #f57c00; }
                .status-paid { background: #e8f5e8; color: #4caf50; }
                .status-processing { background: #e3f2fd; color: #2196f3; }
                .status-shipped { background: #f3e5f5; color: #9c27b0; }
                .status-delivered { background: #e8f5e8; color: #4caf50; }
                .status-cancelled { background: #ffebee; color: #f44336; }

                .payment-unpaid { background: #ffebee; color: #f44336; }
                .payment-paid { background: #e8f5e8; color: #4caf50; }
                .payment-failed { background: #ffebee; color: #f44336; }
                .payment-refunded { background: #fff3e0; color: #f57c00; }

                .order-summary {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1rem;
                    color: #666;
                    font-size: 0.9rem;
                }

                .shipping-info, .order-phone {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .order-actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .btn-icon {
                    margin-right: 0.5rem;
                    font-size: 0.9rem;
                }

                .order-hint {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #e3f2fd;
                    border-radius: 8px;
                    border-left: 4px solid #2196f3;
                    font-size: 0.9rem;
                }

                .order-hint.payment-pending {
                    background: #fff3e0;
                    border-left-color: #ff9800;
                }

                .hint-icon {
                    font-size: 1.1rem;
                    color: #2196f3;
                }

                .order-hint.payment-pending .hint-icon {
                    color: #ff9800;
                }

                .hint-text {
                    color: #333;
                    flex: 1;
                }

                .save-order-btn {
                    background: #4caf50;
                    border-color: #4caf50;
                    color: white;
                }

                .save-order-btn:hover {
                    background: #45a049;
                    border-color: #45a049;
                }

                .pay-order-btn {
                    background: #2196f3;
                    border-color: #2196f3;
                    color: white;
                }

                .pay-order-btn:hover {
                    background: #1976d2;
                    border-color: #1976d2;
                }

                .order-notes {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0e0;
                    font-size: 0.9rem;
                    color: #666;
                }

                .no-orders-message {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #666;
                    font-style: italic;
                }

                .empty-orders {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .empty-orders-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-orders h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .empty-orders p {
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

                /* Modal Styles */
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

                .order-modal-content {
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    position: relative;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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

                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                .order-details {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .order-detail-section h4 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.1rem;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 0.5rem;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    padding: 0.25rem 0;
                }

                .detail-label {
                    font-weight: 500;
                    color: #666;
                }

                .detail-value {
                    color: #333;
                }

                .total-amount {
                    font-weight: bold;
                    font-size: 1.1rem;
                    color: #4CAF50;
                }

                .shipping-details {
                    background: #f9f9f9;
                    padding: 1rem;
                    border-radius: 8px;
                    border-left: 4px solid #4CAF50;
                }

                .address {
                    margin-left: 1rem;
                    color: #666;
                    line-height: 1.4;
                }

                .order-notes-detail {
                    background: #f9f9f9;
                    padding: 1rem;
                    border-radius: 8px;
                    border-left: 4px solid #2196F3;
                    color: #333;
                    font-style: italic;
                    margin: 0;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                @media (max-width: 768px) {
                    .filter-tabs {
                        gap: 0.25rem;
                    }

                    .filter-tab {
                        font-size: 0.8rem;
                        padding: 0.4rem 0.8rem;
                    }

                    .order-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .order-summary {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .order-actions {
                        flex-direction: column;
                    }

                    .detail-row {
                        flex-direction: column;
                        gap: 0.25rem;
                    }

                    .modal-footer {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize orders when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ordersManager = new OrdersManager();
    ordersManager.init().catch(error => {
        console.error('Failed to initialize orders:', error);
    });
});
