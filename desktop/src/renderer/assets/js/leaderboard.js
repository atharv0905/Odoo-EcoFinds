// Leaderboard Page Script
class LeaderboardManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.leaderboard = [];
        this.isLoading = false;
        this.sortBy = 'points';
    }

    async init() {
        await this.waitForServices();
        this.bindEvents();
        this.addLeaderboardStyles();
        
        window.authService.onAuthStateChange((user) => {
            if (user) {
                this.currentUser = user;
                this.loadLeaderboard();
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
        const categoryFilter = document.getElementById('categoryFilter');
        const refreshBtn = document.getElementById('refreshBtn');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.processLeaderboard();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadLeaderboard();
            });
        }
    }

    async loadLeaderboard() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Get all users
            const usersData = await window.apiService.getAllUsers();
            this.users = usersData.users || [];

            if (this.users.length === 0) {
                this.showNoData();
                return;
            }

            // Process and calculate leaderboard data
            await this.calculateLeaderboardData();
            
            // Process leaderboard based on current sort
            this.processLeaderboard();
            
            // Update collective impact stats
            this.updateCollectiveStats();
            
            // Show leaderboard
            this.showLeaderboard();

        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showMessage('Failed to load leaderboard. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async calculateLeaderboardData() {
        this.leaderboard = [];

        for (const user of this.users) {
            try {
                // Get purchase history for each user
                const purchaseData = await window.apiService.getPurchaseHistory(user._id);
                const purchases = purchaseData.purchases || [];
                
                // Calculate stats
                const totalPurchases = purchases.length;
                const totalProducts = purchases.reduce((sum, purchase) => sum + purchase.products.length, 0);
                const points = user.gamification?.points || 0;
                const level = user.gamification?.level || 1;
                const badges = user.gamification?.badges || [];
                
                // Calculate eco impact (mock calculations)
                const co2Saved = totalProducts * 2.5; // 2.5kg CO2 per product
                const waterSaved = totalProducts * 15; // 15L water per product
                const wastePrevented = totalProducts * 150; // 150g waste per product

                this.leaderboard.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    points,
                    level,
                    badges,
                    totalPurchases,
                    totalProducts,
                    co2Saved,
                    waterSaved,
                    wastePrevented,
                    ecoScore: points + (totalProducts * 10) // Combined eco score
                });

            } catch (error) {
                console.error(`Failed to load data for user ${user._id}:`, error);
            }
        }
    }

    processLeaderboard() {
        // Sort leaderboard based on selected criteria
        const sortedLeaderboard = [...this.leaderboard].sort((a, b) => {
            switch (this.sortBy) {
                case 'purchases':
                    return b.totalPurchases - a.totalPurchases;
                case 'impact':
                    return b.ecoScore - a.ecoScore;
                default: // points
                    return b.points - a.points;
            }
        });

        // Add rank to each user
        sortedLeaderboard.forEach((user, index) => {
            user.rank = index + 1;
        });

        // Update UI
        this.updateUserRank(sortedLeaderboard);
        this.updatePodium(sortedLeaderboard);
        this.renderFullLeaderboard(sortedLeaderboard);
    }

    updateUserRank(sortedLeaderboard) {
        const userEntry = sortedLeaderboard.find(user => user.userId === this.currentUser.uid);
        
        const userRankEl = document.getElementById('userRank');
        const userNameEl = document.getElementById('userName');
        const userPointsEl = document.getElementById('userPoints');

        if (userEntry) {
            if (userRankEl) userRankEl.textContent = userEntry.rank;
            if (userNameEl) userNameEl.textContent = userEntry.name;
            if (userPointsEl) userPointsEl.textContent = userEntry.points;
        } else {
            if (userRankEl) userRankEl.textContent = '--';
            if (userNameEl) userNameEl.textContent = this.currentUser.displayName || 'You';
            if (userPointsEl) userPointsEl.textContent = '0';
        }
    }

    updatePodium(sortedLeaderboard) {
        // Top 3 positions
        const positions = ['rank1', 'rank2', 'rank3'];
        
        positions.forEach((position, index) => {
            const user = sortedLeaderboard[index];
            const nameEl = document.getElementById(`${position}Name`);
            const pointsEl = document.getElementById(`${position}Points`);

            if (user) {
                if (nameEl) nameEl.textContent = user.name;
                if (pointsEl) pointsEl.textContent = `${user.points} pts`;
            } else {
                if (nameEl) nameEl.textContent = `${this.getOrdinal(index + 1)} Place`;
                if (pointsEl) pointsEl.textContent = '0 pts';
            }
        });
    }

    renderFullLeaderboard(sortedLeaderboard) {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;

        const leaderboardHTML = sortedLeaderboard.map(user => this.createLeaderboardItemHTML(user)).join('');
        leaderboardList.innerHTML = leaderboardHTML;
    }

    createLeaderboardItemHTML(user) {
        const isCurrentUser = user.userId === this.currentUser.uid;
        const rankClass = user.rank <= 3 ? 'top-three' : '';
        const currentUserClass = isCurrentUser ? 'current-user' : '';
        
        // Get rank medal/icon
        let rankDisplay = `#${user.rank}`;
        if (user.rank === 1) rankDisplay = '🥇';
        else if (user.rank === 2) rankDisplay = '🥈';
        else if (user.rank === 3) rankDisplay = '🥉';

        // Get user initials
        const initials = user.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();

        // Get primary stat based on sort criteria
        let primaryStat = `${user.points} pts`;
        if (this.sortBy === 'purchases') primaryStat = `${user.totalPurchases} orders`;
        else if (this.sortBy === 'impact') primaryStat = `${user.ecoScore} eco score`;

        return `
            <div class="leaderboard-item ${rankClass} ${currentUserClass}">
                <div class="item-rank">${rankDisplay}</div>
                
                <div class="item-avatar">
                    <div class="avatar-circle">
                        <span class="avatar-initials">${initials}</span>
                    </div>
                </div>
                
                <div class="item-info">
                    <div class="item-name">${user.name}${isCurrentUser ? ' (You)' : ''}</div>
                    <div class="item-stats">
                        <span class="primary-stat">${primaryStat}</span>
                        <span class="level-badge">Level ${user.level}</span>
                    </div>
                </div>
                
                <div class="item-badges">
                    ${user.badges.slice(0, 3).map(badge => {
                        const badgeEmojis = {
                            'eco-warrior': '🌱',
                            'first-sale': '🎉',
                            'frequent-buyer': '🛒',
                            'green-seller': '💚',
                            'eco-champion': '🏆'
                        };
                        return `<span class="badge-emoji" title="${badge.replace('-', ' ')}">${badgeEmojis[badge] || '🏅'}</span>`;
                    }).join('')}
                    ${user.badges.length > 3 ? `<span class="more-badges">+${user.badges.length - 3}</span>` : ''}
                </div>
                
                <div class="item-eco-impact">
                    <div class="eco-metric">
                        <span class="eco-value">${user.co2Saved.toFixed(1)}kg</span>
                        <span class="eco-label">CO2 saved</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateCollectiveStats() {
        const totalCO2 = this.leaderboard.reduce((sum, user) => sum + user.co2Saved, 0);
        const totalWater = this.leaderboard.reduce((sum, user) => sum + user.waterSaved, 0);
        const totalWaste = this.leaderboard.reduce((sum, user) => sum + user.wastePrevented, 0);
        const totalWarriors = this.leaderboard.length;

        document.getElementById('totalCO2Saved').textContent = `${totalCO2.toFixed(1)} kg`;
        document.getElementById('totalWaterSaved').textContent = `${totalWater.toFixed(0)} L`;
        document.getElementById('totalWastePrevented').textContent = `${totalWaste.toFixed(0)} g`;
        document.getElementById('totalEcoWarriors').textContent = totalWarriors;
    }

    showLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const noDataEl = document.getElementById('noLeaderboardData');
        
        if (leaderboardList) leaderboardList.classList.remove('hidden');
        if (noDataEl) noDataEl.classList.add('hidden');
    }

    showNoData() {
        const leaderboardList = document.getElementById('leaderboardList');
        const noDataEl = document.getElementById('noLeaderboardData');
        
        if (leaderboardList) leaderboardList.classList.add('hidden');
        if (noDataEl) noDataEl.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('leaderboardLoading');
        const leaderboardList = document.getElementById('leaderboardList');
        const noDataEl = document.getElementById('noLeaderboardData');
        
        if (show) {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (leaderboardList) leaderboardList.classList.add('hidden');
            if (noDataEl) noDataEl.classList.add('hidden');
        } else {
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    showMessage(message, type = 'info') {
        if (window.navbarComponent) {
            window.navbarComponent.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    addLeaderboardStyles() {
        const styleId = 'leaderboard-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .leaderboard-container {
                    max-width: 1000px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }

                .leaderboard-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .leaderboard-header h1 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .leaderboard-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                }

                .user-rank-card {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
                }

                .rank-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                }

                .rank-position {
                    font-size: 3rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }

                .rank-name {
                    font-size: 1.2rem;
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                }

                .rank-points {
                    font-size: 1rem;
                    opacity: 0.9;
                }

                .rank-badge {
                    text-align: center;
                }

                .badge-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                }

                .badge-text {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }

                .podium-section {
                    margin-bottom: 3rem;
                }

                .podium-section h2 {
                    text-align: center;
                    color: #333;
                    margin-bottom: 2rem;
                }

                .podium {
                    display: flex;
                    justify-content: center;
                    align-items: end;
                    gap: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .podium-place {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem 1rem;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    flex: 1;
                    position: relative;
                }

                .podium-place.first {
                    margin-top: -1rem;
                    background: linear-gradient(135deg, #FFD700, #FFC107);
                    color: #333;
                }

                .podium-place.second {
                    margin-top: 0.5rem;
                    background: linear-gradient(135deg, #C0C0C0, #9E9E9E);
                    color: #333;
                }

                .podium-place.third {
                    margin-top: 1rem;
                    background: linear-gradient(135deg, #CD7F32, #8D5524);
                    color: white;
                }

                .podium-avatar {
                    width: 60px;
                    height: 60px;
                    background: rgba(0,0,0,0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .podium-avatar.winner {
                    background: rgba(255,255,255,0.3);
                }

                .podium-name {
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }

                .podium-points {
                    font-size: 0.8rem;
                    opacity: 0.8;
                }

                .podium-medal {
                    position: absolute;
                    top: -15px;
                    right: -15px;
                    font-size: 2rem;
                }

                .full-leaderboard {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 2rem;
                }

                .leaderboard-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e0e0e0;
                }

                .leaderboard-controls h2 {
                    color: #333;
                    margin: 0;
                }

                .controls {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .filter-select {
                    padding: 0.5rem 1rem;
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

                .leaderboard-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .leaderboard-item {
                    display: grid;
                    grid-template-columns: 60px 60px 1fr auto auto;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    align-items: center;
                    transition: transform 0.3s;
                }

                .leaderboard-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .leaderboard-item.top-three {
                    background: linear-gradient(135deg, #fff3e0, #ffe0b2);
                    border: 2px solid #ff9800;
                }

                .leaderboard-item.current-user {
                    background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
                    border: 2px solid #4CAF50;
                }

                .item-rank {
                    font-size: 1.2rem;
                    font-weight: bold;
                    text-align: center;
                    color: #333;
                }

                .item-avatar .avatar-circle {
                    width: 50px;
                    height: 50px;
                    background: #4CAF50;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                }

                .item-info {
                    flex: 1;
                }

                .item-name {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.25rem;
                }

                .item-stats {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .primary-stat {
                    color: #4CAF50;
                    font-weight: 500;
                }

                .level-badge {
                    background: #ff9800;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                }

                .item-badges {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                }

                .badge-emoji {
                    font-size: 1.2rem;
                }

                .more-badges {
                    background: #e0e0e0;
                    color: #666;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.7rem;
                }

                .item-eco-impact {
                    text-align: center;
                }

                .eco-value {
                    font-weight: bold;
                    color: #4CAF50;
                    display: block;
                }

                .eco-label {
                    font-size: 0.8rem;
                    color: #666;
                }

                .no-data {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #666;
                }

                .no-data-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .impact-stats-section {
                    background: linear-gradient(135deg, #e8f5e8, #d4f4d4);
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                }

                .impact-stats-section h2 {
                    color: #4CAF50;
                    margin-bottom: 1.5rem;
                }

                .impact-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .impact-stat {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                }

                .impact-stat .impact-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .impact-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-bottom: 0.25rem;
                }

                .impact-label {
                    color: #666;
                    font-size: 0.9rem;
                }

                .impact-message {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    color: #333;
                }

                .impact-message p {
                    margin: 0;
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .leaderboard-container {
                        padding: 0 0.5rem;
                    }

                    .rank-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }

                    .podium {
                        flex-direction: column;
                        align-items: center;
                    }

                    .podium-place {
                        width: 100%;
                        max-width: 200px;
                        margin-top: 0 !important;
                    }

                    .leaderboard-controls {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: stretch;
                    }

                    .leaderboard-item {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 0.5rem;
                    }

                    .item-stats {
                        justify-content: center;
                    }

                    .impact-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const leaderboardManager = new LeaderboardManager();
    leaderboardManager.init().catch(error => {
        console.error('Failed to initialize leaderboard:', error);
    });
});
