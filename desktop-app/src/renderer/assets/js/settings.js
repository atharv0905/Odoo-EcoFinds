// Settings Page Script
class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.isLoading = false;
    }

    async init() {
        // Wait for services to be available
        await this.waitForServices();
        
        // Initialize settings
        this.bindEvents();
        this.addSettingsStyles();
        
        // Monitor auth state
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
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
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Payment mode selection
        const paymentModeRadios = document.querySelectorAll('input[name="paymentMode"]');
        paymentModeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleRazorpayConfig();
            });
        });

        // Save payment configuration
        const savePaymentBtn = document.getElementById('savePaymentBtn');
        if (savePaymentBtn) {
            savePaymentBtn.addEventListener('click', () => {
                this.savePaymentConfiguration();
            });
        }

        // Account action buttons
        const refreshDataBtn = document.getElementById('refreshDataBtn');
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        const signOutBtn = document.getElementById('signOutBtn');

        if (refreshDataBtn) refreshDataBtn.addEventListener('click', () => this.refreshData());
        if (clearCacheBtn) clearCacheBtn.addEventListener('click', () => this.clearCache());
        if (signOutBtn) signOutBtn.addEventListener('click', () => this.signOut());

        // Global function for hiding message
        window.hideSettingsMessage = () => this.hideMessage();
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Load user profile from backend
            const userData = await window.apiService.getUserById(this.currentUser.uid);
            this.userProfile = userData.user;
            
            this.populateProfileForm();
            this.populatePaymentConfiguration();
            this.populateGamificationStats();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            // If user doesn't exist in backend, create them
            await this.createUserInBackend();
        }
    }

    async createUserInBackend() {
        try {
            await window.apiService.createUser({
                email: this.currentUser.email,
                name: this.currentUser.displayName || 'User'
            });
            
            // Reload user data after creation
            await this.loadUserData();
            
        } catch (error) {
            console.error('Failed to create user in backend:', error);
            this.showMessage('Failed to load user data. Please try refreshing.', 'error');
        }
    }

    populateProfileForm() {
        // Populate from Firebase user
        const displayNameInput = document.getElementById('displayName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');

        if (displayNameInput) displayNameInput.value = this.currentUser.displayName || '';
        if (emailInput) emailInput.value = this.currentUser.email || '';
        
        // Populate phone from backend profile if available
        if (phoneInput && this.userProfile && this.userProfile.phone) {
            phoneInput.value = this.userProfile.phone;
        }
    }

    populatePaymentConfiguration() {
        if (!this.userProfile || !this.userProfile.paymentConfig) return;

        const paymentConfig = this.userProfile.paymentConfig;
        const paymentMode = paymentConfig.mode || 'manual_payout';

        // Set payment mode radio
        const paymentModeRadio = document.querySelector(`input[name="paymentMode"][value="${paymentMode}"]`);
        if (paymentModeRadio) {
            paymentModeRadio.checked = true;
            this.toggleRazorpayConfig();
        }

        // Populate Razorpay fields (note: actual keys would be hashed in backend)
        if (paymentMode === 'razorpay_direct') {
            const keyIdInput = document.getElementById('razorpayKeyId');
            const secretInput = document.getElementById('razorpaySecret');
            
            if (keyIdInput && paymentConfig.razorpayKeyId) {
                keyIdInput.value = '***********' + paymentConfig.razorpayKeyId.slice(-4);
                keyIdInput.placeholder = 'Key ID configured (secured)';
            }
            
            if (secretInput && paymentConfig.razorpaySecret) {
                secretInput.placeholder = 'Secret configured (secured)';
            }
        }
    }

    populateGamificationStats() {
        if (!this.userProfile || !this.userProfile.gamification) return;

        const gamification = this.userProfile.gamification;
        
        const userLevelEl = document.getElementById('userLevel');
        const userPointsEl = document.getElementById('userPoints');
        const userBadgesEl = document.getElementById('userBadges');

        if (userLevelEl) userLevelEl.textContent = gamification.level || 1;
        if (userPointsEl) userPointsEl.textContent = gamification.points || 0;
        if (userBadgesEl) userBadgesEl.textContent = (gamification.badges || []).length;

        // Populate badges
        this.populateBadges(gamification.badges || []);
    }

    populateBadges(badges) {
        const badgesList = document.getElementById('badgesList');
        if (!badgesList) return;

        if (badges.length === 0) {
            badgesList.innerHTML = '<p class="no-badges">No badges earned yet. Start eco-shopping to earn badges!</p>';
            return;
        }

        const badgeEmojis = {
            'eco-warrior': '🌱',
            'first-sale': '🎉',
            'frequent-buyer': '🛒',
            'green-seller': '💚',
            'eco-champion': '🏆'
        };

        const badgesHTML = badges.map(badge => {
            const emoji = badgeEmojis[badge] || '🏅';
            const name = badge.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<div class="badge-item"><span class="badge-emoji">${emoji}</span><span class="badge-name">${name}</span></div>`;
        }).join('');

        badgesList.innerHTML = badgesHTML;
    }

    toggleRazorpayConfig() {
        const razorpayConfig = document.getElementById('razorpayConfig');
        const razorpayRadio = document.getElementById('razorpayDirect');
        
        if (razorpayConfig) {
            if (razorpayRadio.checked) {
                razorpayConfig.classList.remove('hidden');
            } else {
                razorpayConfig.classList.add('hidden');
            }
        }
    }

    async saveProfile() {
        if (!this.currentUser || this.isLoading) return;

        this.setLoadingState('saveProfileBtn', true);

        try {
            const displayName = document.getElementById('displayName').value.trim();
            const phone = document.getElementById('phone').value.trim();

            // Update Firebase profile
            if (displayName !== this.currentUser.displayName) {
                await this.currentUser.updateProfile({ displayName });
            }

            // Update backend profile
            await window.apiService.updateUserProfile(this.currentUser.uid, {
                name: displayName,
                phone: phone
            });

            this.showMessage('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save profile:', error);
            this.showMessage('Failed to save profile. Please try again.', 'error');
        } finally {
            this.setLoadingState('saveProfileBtn', false);
        }
    }

    async savePaymentConfiguration() {
        if (!this.currentUser || this.isLoading) return;

        this.setLoadingState('savePaymentBtn', true);

        try {
            const paymentMode = document.querySelector('input[name="paymentMode"]:checked').value;
            let paymentConfig = { mode: paymentMode };

            if (paymentMode === 'razorpay_direct') {
                const keyId = document.getElementById('razorpayKeyId').value.trim();
                const secret = document.getElementById('razorpaySecret').value.trim();

                if (!keyId || !secret) {
                    this.showMessage('Please provide both Razorpay Key ID and Secret.', 'error');
                    return;
                }

                // Process credentials through API service (will be hashed)
                paymentConfig = window.apiService.processPaymentConfig({
                    mode: paymentMode,
                    razorpayKeyId: keyId,
                    razorpaySecret: secret
                });
            }

            await window.apiService.updatePaymentConfig(this.currentUser.uid, paymentConfig);
            
            this.showMessage('Payment configuration saved successfully!', 'success');
            
            // Reload user data to reflect changes
            await this.loadUserData();
            
        } catch (error) {
            console.error('Failed to save payment configuration:', error);
            this.showMessage('Failed to save payment configuration. Please try again.', 'error');
        } finally {
            this.setLoadingState('savePaymentBtn', false);
        }
    }

    async refreshData() {
        this.showMessage('Refreshing data...', 'info');
        await this.loadUserData();
        this.showMessage('Data refreshed successfully!', 'success');
    }

    clearCache() {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        this.showMessage('Cache cleared successfully!', 'success');
    }

    async signOut() {
        try {
            await window.authService.logout();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Failed to sign out:', error);
            this.showMessage('Failed to sign out. Please try again.', 'error');
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
        const messageEl = document.getElementById('settingsMessage');
        const messageText = messageEl.querySelector('.message-text');
        
        messageText.textContent = message;
        messageEl.className = `settings-message settings-message-${type} show`;

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 3000);
        }
    }

    hideMessage() {
        const messageEl = document.getElementById('settingsMessage');
        messageEl.classList.remove('show');
    }

    addSettingsStyles() {
        const styleId = 'settings-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .settings-container {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .settings-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .settings-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .settings-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                }

                .settings-section {
                    margin-bottom: 2rem;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #333;
                    font-size: 1.3rem;
                    margin-bottom: 1rem;
                }

                .section-icon {
                    font-size: 1.5rem;
                }

                .settings-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
                }

                .form-group input:disabled {
                    background: #f5f5f5;
                    color: #666;
                }

                .form-help {
                    display: block;
                    margin-top: 0.25rem;
                    font-size: 0.85rem;
                    color: #666;
                }

                .payment-options {
                    margin-bottom: 1.5rem;
                }

                .payment-option {
                    margin-bottom: 1rem;
                }

                .payment-option input[type="radio"] {
                    display: none;
                }

                .payment-option-label {
                    display: block;
                    padding: 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .payment-option input[type="radio"]:checked + .payment-option-label {
                    border-color: #4CAF50;
                    background: rgba(76, 175, 80, 0.05);
                }

                .payment-option-content h3 {
                    margin: 0 0 0.5rem 0;
                    color: #333;
                }

                .payment-option-content p {
                    margin: 0 0 0.75rem 0;
                    color: #666;
                }

                .payment-features {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .feature {
                    background: #e8f5e8;
                    color: #4CAF50;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                }

                .razorpay-config {
                    margin-top: 1rem;
                    padding: 1rem;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    background: #f9f9f9;
                }

                .config-warning {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .warning-icon {
                    font-size: 1.5rem;
                    color: #856404;
                }

                .warning-content h4 {
                    margin: 0 0 0.5rem 0;
                    color: #856404;
                }

                .warning-content p {
                    margin: 0;
                    color: #856404;
                    font-size: 0.9rem;
                }

                .gamification-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-item {
                    text-align: center;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #4CAF50;
                }

                .badges-container h4 {
                    margin-bottom: 1rem;
                    color: #333;
                }

                .badges-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                .badge-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: #e8f5e8;
                    color: #4CAF50;
                    border-radius: 20px;
                    font-size: 0.9rem;
                }

                .badge-emoji {
                    font-size: 1.2rem;
                }

                .no-badges {
                    color: #666;
                    font-style: italic;
                }

                .action-buttons {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                }

                .action-buttons .btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-icon {
                    font-size: 1.1rem;
                }

                .settings-message {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    opacity: 0;
                    transform: translateY(100%);
                    transition: all 0.3s;
                    max-width: 400px;
                }

                .settings-message.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .settings-message-info {
                    background: #2196F3;
                }

                .settings-message-success {
                    background: #4CAF50;
                }

                .settings-message-warning {
                    background: #FF9800;
                }

                .settings-message-error {
                    background: #f44336;
                }

                .message-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }

                .message-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                @media (max-width: 768px) {
                    .settings-container {
                        padding: 0 0.5rem;
                    }

                    .settings-card {
                        padding: 1rem;
                    }

                    .action-buttons {
                        grid-template-columns: 1fr;
                    }

                    .gamification-stats {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
    settingsManager.init().catch(error => {
        console.error('Failed to initialize settings:', error);
    });
});
