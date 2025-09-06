// Product Orders Management Page Script
class ProductOrdersManager {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.filteredOrders = [];
        this.selectedOrders = [];
        this.currentPage = 1;
        this.ordersPerPage = 10;
        this.isLoading = false;
        this.stats = {};
    }

    async init() {
        await this.waitForServices();
        this.bindEvents();
        this.addProductOrdersStyles();
        
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
        // Search and filters
        const orderSearch = document.getElementById('orderSearch');
        const statusFilter = document.getElementById('statusFilter');
        const timeFilter = document.getElementById('timeFilter');
        const refreshBtn = document.getElementById('refreshBtn');

        if (orderSearch) {
            orderSearch.addEventListener('input', () => this.filterOrders());
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterOrders());
        }

        if (timeFilter) {
            timeFilter.addEventListener('change', () => this.filterOrders());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrders());
        }

        // Bulk actions
        const selectAllBtn = document.getElementById('selectAllBtn');
        const bulkConfirmBtn = document.getElementById('bulkConfirmBtn');
        const bulkShipBtn = document.getElementById('bulkShipBtn');

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        }

        if (bulkConfirmBtn) {
            bulkConfirmBtn.addEventListener('click', () => this.showBulkActionModal('confirmed'));
        }

        if (bulkShipBtn) {
            bulkShipBtn.addEventListener('click', () => this.showBulkActionModal('shipped'));
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (prevPage) prevPage.addEventListener('click', () => this.previousPage());
        if (nextPage) nextPage.addEventListener('click', () => this.nextPage());

        // Global functions
        window.hideOrderDetailModal = () => this.hideOrderDetailModal();
        window.hideBulkActionModal = () => this.hideBulkActionModal();
    }

    async loadOrders() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Load orders and stats
            const [ordersResult, statsResult] = await Promise.all([
                window.apiService.getSellerOrders(this.currentUser.uid),
                window.apiService.getSellerStats(this.currentUser.uid)
            ]);

            this.orders = ordersResult.orders || [];
            this.stats = statsResult.stats || {};
            this.filteredOrders = [...this.orders];

            if (this.orders.length === 0) {
                this.showNoOrders();
            } else {
                this.updateStats();
                this.renderOrders();
                this.showOrdersContent();
            }

        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showMessage('Failed to load orders. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    updateStats() {
        // Update basic stats
        document.getElementById('totalOrders').textContent = this.stats.totalOrders || 0;
        document.getElementById('pendingOrders').textContent = this.stats.statusBreakdown?.pending || 0;
        document.getElementById('totalRevenue').textContent = `$${(this.stats.totalRevenue || 0).toFixed(2)}`;
        document.getElementById('averageOrder').textContent = `$${(this.stats.averageOrderValue || 0).toFixed(2)}`;

        // Update status breakdown
        const statusBreakdown = this.stats.statusBreakdown || {};
        const totalOrders = this.stats.totalOrders || 1; // Avoid division by zero

        Object.keys(statusBreakdown).forEach(status => {
            const count = statusBreakdown[status];
            const percentage = (count / totalOrders) * 100;

            const countEl = document.getElementById(`${status}Count`);
            const progressEl = document.getElementById(`${status}Progress`);

            if (countEl) countEl.textContent = count;
            if (progressEl) progressEl.style.width = `${percentage}%`;
        });
    }

    filterOrders() {
        const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const timeFilter = document.getElementById('timeFilter').value;

        this.filteredOrders = this.orders.filter(order => {
            // Search filter
            const matchesSearch = !searchTerm || 
                order._id.toLowerCase().includes(searchTerm) ||
                order.buyerId.toLowerCase().includes(searchTerm);

            // Status filter
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            // Time filter
            let matchesTime = true;
            if (timeFilter !== 'all') {
                const orderDate = new Date(order.createdAt);
                const now = new Date();
                
                switch (timeFilter) {
                    case 'today':
                        matchesTime = orderDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesTime = orderDate >= weekAgo;
                        break;
                    case 'month':
                        matchesTime = orderDate.getMonth() === now.getMonth() && 
                                     orderDate.getFullYear() === now.getFullYear();
                        break;
                    case 'quarter':
                        const quarter = Math.floor(now.getMonth() / 3);
                        const orderQuarter = Math.floor(orderDate.getMonth() / 3);
                        matchesTime = orderQuarter === quarter && 
                                     orderDate.getFullYear() === now.getFullYear();
                        break;
                }
            }

            return matchesSearch && matchesStatus && matchesTime;
        });

        this.currentPage = 1;
        this.renderOrders();
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (this.filteredOrders.length === 0) {
            ordersList.innerHTML = '<div class="no-filtered-orders">No orders match your filters.</div>';
            this.hidePagination();
            return;
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);

        const ordersHTML = paginatedOrders.map(order => this.createOrderItemHTML(order)).join('');
        ordersList.innerHTML = ordersHTML;

        this.updatePagination();
        this.bindOrderEvents();
    }

    createOrderItemHTML(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = order.status.toLowerCase().replace('_', '-');
        const isSelected = this.selectedOrders.includes(order._id);
        const canBeProcessed = ['pending', 'confirmed'].includes(order.status);

        return `
            <div class="order-item ${isSelected ? 'selected' : ''}" data-order-id="${order._id}">
                <div class="order-checkbox">
                    <input type="checkbox" class="order-select" data-order-id="${order._id}" 
                           ${isSelected ? 'checked' : ''} ${!canBeProcessed ? 'disabled' : ''}>
                </div>
                
                <div class="order-main-info">
                    <div class="order-header">
                        <div class="order-id">
                            <strong>Order #${order._id.slice(-8).toUpperCase()}</strong>
                        </div>
                        <div class="order-status status-${statusClass}">
                            ${order.status.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="order-product-info">
                        <div class="product-image">
                            <img src="${order.productId?.image || 'https://via.placeholder.com/60x60?text=Product'}" 
                                 alt="${order.productId?.title || 'Product'}" loading="lazy">
                        </div>
                        <div class="product-details">
                            <h4 class="product-title">${order.productId?.title || 'Product'}</h4>
                            <p class="product-category">${order.productId?.category || ''}</p>
                        </div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-item">
                            <span class="label">Quantity:</span>
                            <span class="value">${order.quantity}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Unit Price:</span>
                            <span class="value">$${order.unitPrice.toFixed(2)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Total:</span>
                            <span class="value total-amount">$${order.totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Date:</span>
                            <span class="value">${orderDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showOrderDetail('${order._id}')">
                        View Details
                    </button>
                    
                    ${order.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${order._id}', 'confirmed')">
                            Confirm
                        </button>
                    ` : ''}
                    
                    ${order.status === 'confirmed' ? `
                        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order._id}', 'shipped')">
                            Ship
                        </button>
                    ` : ''}
                    
                    ${order.status === 'shipped' ? `
                        <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${order._id}', 'delivered')">
                            Mark Delivered
                        </button>
                    ` : ''}
                    
                    ${canBeProcessed ? `
                        <button class="btn btn-danger btn-sm" onclick="cancelOrder('${order._id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    bindOrderEvents() {
        // Order selection checkboxes
        const checkboxes = document.querySelectorAll('.order-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                if (e.target.checked) {
                    if (!this.selectedOrders.includes(orderId)) {
                        this.selectedOrders.push(orderId);
                    }
                } else {
                    this.selectedOrders = this.selectedOrders.filter(id => id !== orderId);
                }
                
                this.updateBulkActionButtons();
                this.updateOrderSelectionUI();
            });
        });

        // Global functions for order actions
        window.showOrderDetail = (orderId) => this.showOrderDetail(orderId);
        window.updateOrderStatus = (orderId, status) => this.updateOrderStatus(orderId, status);
        window.cancelOrder = (orderId) => this.cancelOrder(orderId);
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.order-select:not(:disabled)');
        const allSelected = this.selectedOrders.length === checkboxes.length;

        if (allSelected) {
            // Deselect all
            this.selectedOrders = [];
        } else {
            // Select all
            this.selectedOrders = Array.from(checkboxes).map(cb => cb.getAttribute('data-order-id'));
        }

        this.updateBulkActionButtons();
        this.updateOrderSelectionUI();
    }

    updateOrderSelectionUI() {
        const checkboxes = document.querySelectorAll('.order-select');
        checkboxes.forEach(checkbox => {
            const orderId = checkbox.getAttribute('data-order-id');
            checkbox.checked = this.selectedOrders.includes(orderId);
            
            const orderItem = checkbox.closest('.order-item');
            if (orderItem) {
                orderItem.classList.toggle('selected', checkbox.checked);
            }
        });
    }

    updateBulkActionButtons() {
        const bulkConfirmBtn = document.getElementById('bulkConfirmBtn');
        const bulkShipBtn = document.getElementById('bulkShipBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');

        const hasSelection = this.selectedOrders.length > 0;
        
        if (bulkConfirmBtn) bulkConfirmBtn.disabled = !hasSelection;
        if (bulkShipBtn) bulkShipBtn.disabled = !hasSelection;
        
        if (selectAllBtn) {
            const enabledCheckboxes = document.querySelectorAll('.order-select:not(:disabled)');
            selectAllBtn.textContent = this.selectedOrders.length === enabledCheckboxes.length ? 'Deselect All' : 'Select All';
        }
    }

    async showOrderDetail(orderId) {
        try {
            const result = await window.apiService.getProductOrderById(orderId);
            const order = result.order;

            const modal = document.getElementById('orderDetailModal');
            const content = document.getElementById('orderDetailContent');

            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            content.innerHTML = `
                <div class="order-detail-header">
                    <h4>Order #${order._id.slice(-8).toUpperCase()}</h4>
                    <div class="order-status status-${order.status.toLowerCase().replace('_', '-')}">
                        ${order.status.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
                
                <div class="order-detail-sections">
                    <div class="detail-section">
                        <h5>Product Information</h5>
                        <div class="product-detail">
                            <img src="${order.productId?.image || 'https://via.placeholder.com/100x100?text=Product'}" 
                                 alt="${order.productId?.title}" class="product-image-large">
                            <div class="product-info">
                                <h6>${order.productId?.title}</h6>
                                <p class="product-description">${order.productId?.description || ''}</p>
                                <span class="product-category">${order.productId?.category}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h5>Order Details</h5>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Quantity:</span>
                                <span class="detail-value">${order.quantity}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Unit Price:</span>
                                <span class="detail-value">$${order.unitPrice.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Total Amount:</span>
                                <span class="detail-value total">$${order.totalPrice.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Order Date:</span>
                                <span class="detail-value">${orderDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${order.shippingAddress ? `
                        <div class="detail-section">
                            <h5>Shipping Address</h5>
                            <div class="address-info">
                                <p>${order.shippingAddress.street}</p>
                                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                                <p>${order.shippingAddress.country}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${order.notes ? `
                        <div class="detail-section">
                            <h5>Notes</h5>
                            <p class="order-notes">${order.notes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-detail-actions">
                    ${order.status === 'pending' ? `
                        <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'confirmed'); hideOrderDetailModal();">
                            Confirm Order
                        </button>
                    ` : ''}
                    
                    ${order.status === 'confirmed' ? `
                        <button class="btn btn-primary" onclick="updateOrderStatus('${order._id}', 'shipped'); hideOrderDetailModal();">
                            Mark as Shipped
                        </button>
                    ` : ''}
                    
                    ${order.status === 'shipped' ? `
                        <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'delivered'); hideOrderDetailModal();">
                            Mark as Delivered
                        </button>
                    ` : ''}
                    
                    ${['pending', 'confirmed'].includes(order.status) ? `
                        <button class="btn btn-danger" onclick="cancelOrder('${order._id}'); hideOrderDetailModal();">
                            Cancel Order
                        </button>
                    ` : ''}
                </div>
            `;

            modal.classList.remove('hidden');

        } catch (error) {
            console.error('Failed to load order details:', error);
            this.showMessage('Failed to load order details. Please try again.', 'error');
        }
    }

    hideOrderDetailModal() {
        const modal = document.getElementById('orderDetailModal');
        modal.classList.add('hidden');
    }

    async updateOrderStatus(orderId, status) {
        try {
            await window.apiService.updateOrderStatus(orderId, status, this.currentUser.uid);
            this.showMessage(`Order ${status} successfully!`, 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Failed to update order status:', error);
            this.showMessage('Failed to update order status. Please try again.', 'error');
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
            return;
        }

        try {
            await window.apiService.cancelOrder(orderId, this.currentUser.uid, 'Cancelled by seller');
            this.showMessage('Order cancelled successfully!', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Failed to cancel order:', error);
            this.showMessage('Failed to cancel order. Please try again.', 'error');
        }
    }

    showBulkActionModal(action) {
        if (this.selectedOrders.length === 0) return;

        const modal = document.getElementById('bulkActionModal');
        const message = document.getElementById('bulkActionMessage');
        const ordersList = document.getElementById('selectedOrdersList');
        const confirmBtn = document.getElementById('confirmBulkActionBtn');

        const actionText = action === 'confirmed' ? 'confirm' : 'ship';
        message.textContent = `Are you sure you want to ${actionText} ${this.selectedOrders.length} selected order(s)?`;

        const selectedOrdersHTML = this.selectedOrders.map(orderId => {
            const order = this.orders.find(o => o._id === orderId);
            return order ? `<div class="selected-order">Order #${order._id.slice(-8).toUpperCase()}</div>` : '';
        }).join('');

        ordersList.innerHTML = selectedOrdersHTML;

        confirmBtn.onclick = () => this.executeBulkAction(action);

        modal.classList.remove('hidden');
    }

    hideBulkActionModal() {
        const modal = document.getElementById('bulkActionModal');
        modal.classList.add('hidden');
    }

    async executeBulkAction(action) {
        this.hideBulkActionModal();

        try {
            const promises = this.selectedOrders.map(orderId => 
                window.apiService.updateOrderStatus(orderId, action, this.currentUser.uid)
            );

            await Promise.all(promises);

            this.showMessage(`${this.selectedOrders.length} orders ${action} successfully!`, 'success');
            this.selectedOrders = [];
            await this.loadOrders();

        } catch (error) {
            console.error('Failed to execute bulk action:', error);
            this.showMessage('Some orders failed to update. Please try again.', 'error');
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderOrders();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrders();
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }

        if (pagination) pagination.classList.remove('hidden');
        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
    }

    hidePagination() {
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.classList.add('hidden');
    }

    showOrdersContent() {
        const ordersContent = document.getElementById('ordersContent');
        const noOrders = document.getElementById('noOrders');
        
        if (ordersContent) ordersContent.classList.remove('hidden');
        if (noOrders) noOrders.classList.add('hidden');
    }

    showNoOrders() {
        const ordersContent = document.getElementById('ordersContent');
        const noOrders = document.getElementById('noOrders');
        
        if (ordersContent) ordersContent.classList.add('hidden');
        if (noOrders) noOrders.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('ordersLoading');
        const ordersContent = document.getElementById('ordersContent');
        const noOrders = document.getElementById('noOrders');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (ordersContent) ordersContent.classList.add('hidden');
            if (noOrders) noOrders.classList.add('hidden');
        } else {
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

    addProductOrdersStyles() {
        const styleId = 'product-orders-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .product-orders-container {
                    max-width: 1400px;
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

                .header-actions {
                    display: flex;
                    gap: 1rem;
                }

                .stats-dashboard {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.3s;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                }

                .stat-card.total .stat-icon { color: #2196F3; }
                .stat-card.pending .stat-icon { color: #FF9800; }
                .stat-card.revenue .stat-icon { color: #4CAF50; }
                .stat-card.average .stat-icon { color: #9C27B0; }

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

                .status-breakdown h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .status-bars {
                    display: grid;
                    gap: 0.75rem;
                }

                .status-bar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .status-info {
                    display: flex;
                    justify-content: space-between;
                    min-width: 120px;
                    font-size: 0.9rem;
                }

                .status-label {
                    color: #666;
                }

                .status-count {
                    font-weight: bold;
                    color: #333;
                }

                .status-progress {
                    flex: 1;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    transition: width 0.3s;
                }

                .progress-fill.pending { background: #FF9800; }
                .progress-fill.confirmed { background: #2196F3; }
                .progress-fill.shipped { background: #4CAF50; }
                .progress-fill.delivered { background: #8BC34A; }

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
                    align-items: center;
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

                .orders-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .orders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                }

                .orders-header h2 {
                    color: #333;
                    margin: 0;
                }

                .bulk-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-sm {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.8rem;
                }

                .orders-list {
                    display: flex;
                    flex-direction: column;
                }

                .order-item {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    gap: 1rem;
                    padding: 1.5rem;
                    border-bottom: 1px solid #f0f0f0;
                    align-items: center;
                    transition: background 0.3s;
                }

                .order-item:hover {
                    background: #f8f9fa;
                }

                .order-item.selected {
                    background: #e3f2fd;
                    border-left: 4px solid #2196F3;
                }

                .order-checkbox {
                    display: flex;
                    align-items: center;
                }

                .order-select {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .order-main-info {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 1.5rem;
                    align-items: center;
                    width: 100%;
                }

                .order-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .order-id {
                    color: #333;
                    font-size: 1rem;
                }

                .order-status {
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-align: center;
                    min-width: 80px;
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

                .order-product-info {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .product-image {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-details {
                    flex: 1;
                }

                .product-title {
                    margin: 0 0 0.25rem 0;
                    color: #333;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .product-category {
                    color: #666;
                    font-size: 0.8rem;
                    margin: 0;
                }

                .order-summary {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                    min-width: 200px;
                }

                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }

                .summary-item .label {
                    color: #666;
                }

                .summary-item .value {
                    font-weight: 500;
                    color: #333;
                }

                .total-amount {
                    color: #4CAF50 !important;
                    font-weight: bold !important;
                }

                .order-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    min-width: 120px;
                }

                .no-orders {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .no-orders-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .no-orders h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .no-orders p {
                    color: #666;
                    margin-bottom: 2rem;
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

                .order-detail-modal {
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

                .order-detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e0e0e0;
                }

                .order-detail-sections {
                    display: grid;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .detail-section h5 {
                    color: #333;
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                }

                .product-detail {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                }

                .product-image-large {
                    width: 100px;
                    height: 100px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .product-info h6 {
                    margin: 0 0 0.5rem 0;
                    color: #333;
                }

                .product-description {
                    color: #666;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.4;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .detail-label {
                    color: #666;
                }

                .detail-value {
                    font-weight: 500;
                    color: #333;
                }

                .detail-value.total {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .address-info {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                }

                .address-info p {
                    margin: 0 0 0.25rem 0;
                    color: #333;
                }

                .order-notes {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    color: #333;
                    margin: 0;
                    line-height: 1.4;
                }

                .order-detail-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0e0;
                }

                .selected-orders {
                    margin: 1rem 0;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .selected-order {
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 4px;
                    margin-bottom: 0.25rem;
                    font-size: 0.9rem;
                    color: #333;
                }

                .no-filtered-orders {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                    font-style: italic;
                }

                @media (max-width: 1024px) {
                    .order-main-info {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .order-summary {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .product-orders-container {
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

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .order-item {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }

                    .order-product-info {
                        justify-content: center;
                    }

                    .order-actions {
                        flex-direction: row;
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .detail-grid {
                        grid-template-columns: 1fr;
                    }

                    .order-detail-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize Product Orders when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const productOrdersManager = new ProductOrdersManager();
    productOrdersManager.init().catch(error => {
        console.error('Failed to initialize Product Orders:', error);
    });
});
