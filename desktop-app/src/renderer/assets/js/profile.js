// Profile Page Script
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.isLoading = false;
    }

    async init() {
        await this.waitForServices();
        this.addProfileStyles();
        
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProfile();
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

    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            // Load user profile
            const userData = await window.apiService.getUserById(this.currentUser.uid);
            this.userProfile = userData.user;
            
            // Load purchase history for stats
            const purchaseData = await window.apiService.getPurchaseHistory(this.currentUser.uid);
            
            this.updateProfileInfo();
            this.updateStats(purchaseData);
            this.loadRecentActivity(purchaseData.purchases || []);
            this.loadAchievements();
            
        } catch (error) {
            console.error('Failed to load profile:', error);
            // If user doesn't exist in backend, create them
            await this.createUserInBackend();
        }
    }

    updateProfileInfo() {
        // Update basic profile info
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const avatarInitials = document.getElementById('avatarInitials');
        const userLevel = document.getElementById('userLevel');

        if (profileName) profileName.textContent = this.currentUser.displayName || 'User';
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
        
        // Generate initials
        const name = this.currentUser.displayName || this.currentUser.email;
        const initials = name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
        if (avatarInitials) avatarInitials.textContent = initials;
        
        // Update level
        if (userLevel && this.userProfile?.gamification) {
            userLevel.textContent = this.userProfile.gamification.level || 1;
        }
    }

    updateStats(purchaseData) {
        const totalOrders = purchaseData.count || 0;
        const totalProducts = purchaseData.totalProducts || 0;
        const ecoPoints = this.userProfile?.gamification?.points || 0;
        
        // Calculate total spent (mock calculation)
        const totalSpent = totalProducts * 25; // Average $25 per product
        const carbonSaved = totalProducts * 2.5; // 2.5kg CO2 per product

        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('ecoPoints').textContent = ecoPoints;
        document.getElementById('totalSavings').textContent = `$${totalSpent}`;
        document.getElementById('carbonSaved').textContent = `${carbonSaved}kg`;
    }

    loadRecentActivity(purchases) {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        if (purchases.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity. Start shopping to see your activity here!</p>';
            return;
        }

        // Show last 5 activities
        const recentPurchases = purchases.slice(0, 5);
        const activitiesHTML = recentPurchases.map(purchase => {
            const date = new Date(purchase.createdAt).toLocaleDateString();
            const productCount = purchase.products.length;
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">📦</div>
                    <div class="activity-content">
                        <div class="activity-title">Order completed</div>
                        <div class="activity-description">${productCount} eco-friendly product${productCount !== 1 ? 's' : ''} purchased</div>
                        <div class="activity-date">${date}</div>
                    </div>
                    <div class="activity-points">+${productCount * 10} pts</div>
                </div>
            `;
        }).join('');

        activityList.innerHTML = activitiesHTML;
    }

    loadAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;

        const badges = this.userProfile?.gamification?.badges || [];
        
        const allAchievements = [
            { id: 'eco-warrior', name: 'Eco Warrior', icon: '🌱', description: 'Made your first eco-friendly purchase', earned: badges.includes('eco-warrior') },
            { id: 'first-sale', name: 'First Sale', icon: '🎉', description: 'Completed your first order', earned: badges.includes('first-sale') },
            { id: 'frequent-buyer', name: 'Frequent Buyer', icon: '🛒', description: 'Made 10+ purchases', earned: badges.includes('frequent-buyer') },
            { id: 'green-seller', name: 'Green Seller', icon: '💚', description: 'Contributed to the eco community', earned: badges.includes('green-seller') },
            { id: 'eco-champion', name: 'Eco Champion', icon: '🏆', description: 'Reached 1000+ eco points', earned: badges.includes('eco-champion') },
            { id: 'planet-saver', name: 'Planet Saver', icon: '🌍', description: 'Saved 50kg+ of CO2', earned: false }
        ];

        const achievementsHTML = allAchievements.map(achievement => `
            <div class="achievement-card ${achievement.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                ${achievement.earned ? '<div class="achievement-badge">✓</div>' : '<div class="achievement-lock">🔒</div>'}
            </div>
        `).join('');

        achievementsList.innerHTML = achievementsHTML;
    }

    async createUserInBackend() {
        try {
            await window.apiService.createUser({
                email: this.currentUser.email,
                name: this.currentUser.displayName || 'User'
            });
            
            // Reload user data after creation
            await this.loadUserProfile();
            
        } catch (error) {
            console.error('Failed to create user in backend:', error);
            this.showMessage('Failed to load user data. Please try refreshing.', 'error');
        }
    }

    showMessage(message, type = 'info') {
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    addProfileStyles() {
        const styleId = 'profile-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .profile-container {
                    max-width: 900px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    margin-bottom: 2rem;
                }

                .profile-avatar {
                    flex-shrink: 0;
                }

                .avatar-circle {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2rem;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                }

                .profile-info {
                    flex: 1;
                }

                .profile-info h1 {
                    margin: 0 0 0.5rem 0;
                    color: #333;
                    font-size: 2rem;
                }

                .profile-info p {
                    margin: 0 0 1rem 0;
                    color: #666;
                    font-size: 1.1rem;
                }

                .profile-badges {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .badge.eco-warrior {
                    background: #e8f5e8;
                    color: #4CAF50;
                }

                .badge.level-badge {
                    background: #fff3e0;
                    color: #ff9800;
                }

                .profile-stats-grid {
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

                .stat-card.purchases .stat-icon { color: #2196F3; }
                .stat-card.points .stat-icon { color: #FF9800; }
                .stat-card.savings .stat-icon { color: #4CAF50; }
                .stat-card.impact .stat-icon { color: #9C27B0; }

                .stat-icon {
                    font-size: 2.5rem;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-number {
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }

                .section-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 2rem;
                }

                .section-card h2 {
                    color: #333;
                    margin: 0 0 1.5rem 0;
                    font-size: 1.3rem;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .activity-icon {
                    font-size: 1.5rem;
                    color: #4CAF50;
                }

                .activity-content {
                    flex: 1;
                }

                .activity-title {
                    font-weight: 500;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .activity-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 0.25rem;
                }

                .activity-date {
                    color: #999;
                    font-size: 0.8rem;
                }

                .activity-points {
                    color: #4CAF50;
                    font-weight: bold;
                    font-size: 0.9rem;
                }

                .no-activity {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 2rem;
                }

                .achievements-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1rem;
                }

                .achievement-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-radius: 8px;
                    transition: transform 0.3s;
                }

                .achievement-card.earned {
                    background: #e8f5e8;
                    border: 2px solid #4CAF50;
                }

                .achievement-card.locked {
                    background: #f5f5f5;
                    border: 2px solid #e0e0e0;
                    opacity: 0.6;
                }

                .achievement-card:hover {
                    transform: translateY(-2px);
                }

                .achievement-icon {
                    font-size: 2rem;
                }

                .achievement-info {
                    flex: 1;
                }

                .achievement-name {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .achievement-description {
                    color: #666;
                    font-size: 0.9rem;
                }

                .achievement-badge {
                    color: #4CAF50;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .achievement-lock {
                    color: #999;
                    font-size: 1.2rem;
                }

                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                }

                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1.5rem 1rem;
                    background: #f8f9fa;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-decoration: none;
                    color: #333;
                }

                .action-btn:hover {
                    background: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                    transform: translateY(-2px);
                }

                .action-icon {
                    font-size: 2rem;
                }

                .action-text {
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .profile-container {
                        padding: 0 0.5rem;
                    }

                    .profile-header {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }

                    .profile-stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    }

                    .stat-card {
                        padding: 1rem;
                    }

                    .stat-icon {
                        font-size: 2rem;
                    }

                    .stat-number {
                        font-size: 1.4rem;
                    }

                    .achievements-grid {
                        grid-template-columns: 1fr;
                    }

                    .quick-actions-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
    profileManager.init().catch(error => {
        console.error('Failed to initialize profile:', error);
    });
});
