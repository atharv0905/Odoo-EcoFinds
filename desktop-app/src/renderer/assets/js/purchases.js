// Purchases Page Script
class PurchasesManager {
    constructor() {
        this.currentUser = null;
        this.purchases = [];
        this.purchaseProducts = [];
        this.isLoading = false;
        this.sortOrder = 'newest';
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize purchases
        this.bindEvents();
        this.addPurchasesStyles();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadPurchases();
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
        // Sort filter
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.renderPurchases();
            });
        }

        // Global function for modal
        window.hidePurchaseModal = () => this.hidePurchaseModal();
    }

    async loadPurchases() {
        if (!this.currentUser || this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Get purchase history from API
            const purchaseData = await window.apiService.getPurchaseHistory(this.currentUser.uid);
            this.purchases = purchaseData.purchases || [];

            if (this.purchases.length === 0) {
                this.showNoPurchases();
                return;
            }

            // Load product details for each purchase
            await this.loadPurchaseProducts();
            
            // Update stats
            this.updateStats();
            
            // Render purchases
            this.renderPurchases();
            
            // Show content and eco impact
            this.showPurchasesContent();
            this.showEcoImpact();

        } catch (error) {
            console.error('Failed to load purchases:', error);
            this.showMessage('Failed to load purchase history. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async loadPurchaseProducts() {
        this.purchaseProducts = [];
        
        for (const purchase of this.purchases) {
            const purchaseWithProducts = {
                ...purchase,
                productDetails: []
            };

            for (const productId of purchase.products) {
                try {
                    const productData = await window.apiService.getProductById(productId);
                    purchaseWithProducts.productDetails.push(productData.product);
                } catch (error) {
                    console.error(`Failed to load product ${productId}:`, error);
                }
            }

            this.purchaseProducts.push(purchaseWithProducts);
        }
    }

    updateStats() {
        const totalPurchases = this.purchases.length;
        const totalProducts = this.purchases.reduce((sum, purchase) => sum + purchase.products.length, 0);
        
        // Calculate total spent
        const totalSpent = this.purchaseProducts.reduce((sum, purchase) => {
            return sum + purchase.productDetails.reduce((pSum, product) => pSum + parseFloat(product.price || 0), 0);
        }, 0);

        // Calculate eco points (10 points per product)
        const ecoPoints = totalProducts * 10;

        // Update UI
        document.getElementById('totalPurchases').textContent = totalPurchases;
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
        document.getElementById('ecoImpact').textContent = ecoPoints;

        // Update eco impact section
        this.updateEcoImpact(totalProducts);
    }

    updateEcoImpact(totalProducts) {
        // Calculate environmental impact (mock calculations)
        const carbonSaved = (totalProducts * 2.5).toFixed(1); // 2.5kg CO2 per eco product
        const waterSaved = (totalProducts * 15).toFixed(0); // 15L water per eco product
        const wastePrevented = (totalProducts * 150).toFixed(0); // 150g waste per eco product
        
        // Determine eco rank
        let ecoRank = 'Eco Starter';
        if (totalProducts >= 50) ecoRank = 'Eco Champion';
        else if (totalProducts >= 20) ecoRank = 'Eco Expert';
        else if (totalProducts >= 10) ecoRank = 'Eco Warrior';
        else if (totalProducts >= 5) ecoRank = 'Eco Friend';

        document.getElementById('carbonSaved').textContent = `${carbonSaved} kg`;
        document.getElementById('waterSaved').textContent = `${waterSaved} L`;
        document.getElementById('wastePrevented').textContent = `${wastePrevented} g`;
        document.getElementById('ecoRank').textContent = ecoRank;
    }

    renderPurchases() {
        const purchasesList = document.getElementById('purchasesList');
        if (!purchasesList) return;

        // Sort purchases
        const sortedPurchases = [...this.purchaseProducts].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            
            return this.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Render purchase items
        const purchasesHTML = sortedPurchases.map(purchase => this.createPurchaseHTML(purchase)).join('');
        purchasesList.innerHTML = purchasesHTML;

        // Bind purchase events
        this.bindPurchaseEvents();
    }

    createPurchaseHTML(purchase) {
        const purchaseDate = new Date(purchase.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const totalAmount = purchase.productDetails.reduce((sum, product) => sum + parseFloat(product.price || 0), 0);
        const productCount = purchase.productDetails.length;
        
        // Get first few product images for preview
        const previewImages = purchase.productDetails.slice(0, 3).map(product => 
            product.image || 'https://via.placeholder.com/80x80?text=Product'
        );

        return `
            <div class="purchase-item" data-purchase-id="${purchase._id}">
                <div class="purchase-header">
                    <div class="purchase-info">
                        <h3 class="purchase-title">Order #${purchase._id.slice(-8).toUpperCase()}</h3>
                        <p class="purchase-date">${purchaseDate}</p>
                    </div>
                    <div class="purchase-summary">
                        <div class="purchase-amount">$${totalAmount.toFixed(2)}</div>
                        <div class="purchase-count">${productCount} item${productCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                
                <div class="purchase-preview">
                    <div class="product-previews">
                        ${previewImages.map(img => `
                            <div class="product-preview">
                                <img src="${img}" alt="Product" loading="lazy">
                            </div>
                        `).join('')}
                        ${productCount > 3 ? `<div class="more-products">+${productCount - 3}</div>` : ''}
                    </div>
                    
                    <div class="purchase-actions">
                        <button class="btn btn-secondary view-details-btn" data-purchase-id="${purchase._id}">
                            View Details
                        </button>
                        <div class="eco-badge">
                            <span class="eco-icon">🌱</span>
                            <span class="eco-text">+${productCount * 10} Eco Points</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindPurchaseEvents() {
        const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
        
        viewDetailsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const purchaseId = e.target.getAttribute('data-purchase-id');
                this.showPurchaseDetails(purchaseId);
            });
        });
    }

    showPurchaseDetails(purchaseId) {
        const purchase = this.purchaseProducts.find(p => p._id === purchaseId);
        if (!purchase) return;

        const modal = document.getElementById('purchaseModal');
        const modalContent = document.getElementById('purchaseModalContent');
        
        if (!modal || !modalContent) return;

        const purchaseDate = new Date(purchase.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const totalAmount = purchase.productDetails.reduce((sum, product) => sum + parseFloat(product.price || 0), 0);

        const modalHTML = `
            <div class="purchase-detail-header">
                <h4>Order #${purchase._id.slice(-8).toUpperCase()}</h4>
                <p class="purchase-detail-date">Purchased on ${purchaseDate}</p>
            </div>
            
            <div class="purchase-detail-products">
                <h5>Products Ordered</h5>
                <div class="product-list">
                    ${purchase.productDetails.map(product => `
                        <div class="product-detail-item">
                            <div class="product-image">
                                <img src="${product.image || 'https://via.placeholder.com/80x80?text=Product'}" alt="${product.title}" loading="lazy">
                            </div>
                            <div class="product-info">
                                <h6>${product.title}</h6>
                                <p class="product-category">${product.category}</p>
                                <p class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="purchase-detail-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                </div>
                <div class="summary-row total-row">
                    <span>Total:</span>
                    <span>$${totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row eco-row">
                    <span>Eco Points Earned:</span>
                    <span>+${purchase.productDetails.length * 10} points</span>
                </div>
            </div>
        `;

        modalContent.innerHTML = modalHTML;
        modal.classList.remove('hidden');
    }

    hidePurchaseModal() {
        const modal = document.getElementById('purchaseModal');
        if (modal) modal.classList.add('hidden');
    }

    showPurchasesContent() {
        const purchasesContent = document.getElementById('purchasesContent');
        const noPurchases = document.getElementById('noPurchases');
        
        if (purchasesContent) purchasesContent.classList.remove('hidden');
        if (noPurchases) noPurchases.classList.add('hidden');
    }

    showNoPurchases() {
        const purchasesContent = document.getElementById('purchasesContent');
        const noPurchases = document.getElementById('noPurchases');
        
        if (purchasesContent) purchasesContent.classList.add('hidden');
        if (noPurchases) noPurchases.classList.remove('hidden');
        
        // Update stats to zero
        document.getElementById('totalPurchases').textContent = '0';
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalSpent').textContent = '$0';
        document.getElementById('ecoImpact').textContent = '0';
    }

    showEcoImpact() {
        const ecoImpactSection = document.getElementById('ecoImpactSection');
        if (ecoImpactSection) ecoImpactSection.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('purchasesLoading');
        const purchasesContent = document.getElementById('purchasesContent');
        const noPurchases = document.getElementById('noPurchases');
        const ecoImpactSection = document.getElementById('ecoImpactSection');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (purchasesContent) purchasesContent.classList.add('hidden');
            if (noPurchases) noPurchases.classList.add('hidden');
            if (ecoImpactSection) ecoImpactSection.classList.add('hidden');
        } else {
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

    addPurchasesStyles() {
        const styleId = 'purchases-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .purchases-container {
                    max-width: 1000px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .purchases-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .purchases-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .purchases-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                }

                .purchase-stats {
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
                }

                .stat-icon {
                    font-size: 2.5rem;
                    color: #4CAF50;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
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

                .purchases-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e0e0e0;
                }

                .purchases-header-section h2 {
                    color: #333;
                    margin: 0;
                }

                .filter-select {
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    color: #333;
                    cursor: pointer;
                }

                .purchases-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .purchase-item {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .purchase-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }

                .purchase-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .purchase-title {
                    color: #333;
                    margin: 0 0 0.25rem 0;
                    font-size: 1.1rem;
                }

                .purchase-date {
                    color: #666;
                    margin: 0;
                    font-size: 0.9rem;
                }

                .purchase-summary {
                    text-align: right;
                }

                .purchase-amount {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-bottom: 0.25rem;
                }

                .purchase-count {
                    color: #666;
                    font-size: 0.9rem;
                }

                .purchase-preview {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .product-previews {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .product-preview {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .product-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .more-products {
                    width: 60px;
                    height: 60px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-weight: bold;
                    font-size: 0.9rem;
                }

                .purchase-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .eco-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #e8f5e8;
                    color: #4CAF50;
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .eco-icon {
                    font-size: 1.1rem;
                }

                .no-purchases {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .no-purchases-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .no-purchases h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .no-purchases p {
                    color: #666;
                    margin-bottom: 2rem;
                }

                .eco-impact-section {
                    margin-top: 2rem;
                }

                .impact-card {
                    background: linear-gradient(135deg, #e8f5e8 0%, #d4f4d4 100%);
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .impact-card h3 {
                    text-align: center;
                    color: #4CAF50;
                    margin-bottom: 1.5rem;
                }

                .impact-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .impact-item {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                }

                .impact-item .impact-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .impact-value {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-bottom: 0.25rem;
                }

                .impact-label {
                    color: #666;
                    font-size: 0.9rem;
                }

                .impact-message {
                    text-align: center;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    color: #333;
                }

                .impact-message p {
                    margin: 0;
                    line-height: 1.5;
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

                .purchase-modal {
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
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

                .purchase-detail-header {
                    margin-bottom: 1.5rem;
                }

                .purchase-detail-header h4 {
                    margin: 0 0 0.5rem 0;
                    color: #333;
                }

                .purchase-detail-date {
                    margin: 0;
                    color: #666;
                }

                .purchase-detail-products h5 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .product-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .product-detail-item {
                    display: flex;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: #f9f9f9;
                    border-radius: 8px;
                }

                .product-detail-item .product-image {
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .product-detail-item .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-detail-item .product-info h6 {
                    margin: 0 0 0.25rem 0;
                    color: #333;
                    font-size: 0.95rem;
                }

                .product-detail-item .product-category {
                    color: #666;
                    font-size: 0.8rem;
                    margin: 0 0 0.25rem 0;
                }

                .product-detail-item .product-price {
                    color: #4CAF50;
                    font-weight: bold;
                    margin: 0;
                }

                .purchase-detail-summary {
                    border-top: 1px solid #e0e0e0;
                    padding-top: 1rem;
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
                    padding-top: 0.5rem;
                    border-top: 1px solid #e0e0e0;
                    margin-top: 0.5rem;
                }

                .summary-row.eco-row {
                    color: #4CAF50;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .purchases-container {
                        padding: 0 0.5rem;
                    }

                    .purchase-stats {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    }

                    .stat-card {
                        padding: 1rem;
                    }

                    .stat-icon {
                        font-size: 2rem;
                    }

                    .stat-value {
                        font-size: 1.4rem;
                    }

                    .purchases-header-section {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }

                    .purchase-header {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .purchase-summary {
                        text-align: left;
                    }

                    .purchase-preview {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }

                    .impact-grid {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize purchases when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const purchasesManager = new PurchasesManager();
    purchasesManager.init().catch(error => {
        console.error('Failed to initialize purchases:', error);
    });
});
