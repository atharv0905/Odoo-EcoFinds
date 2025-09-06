// Dashboard Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authService to be available
    const waitForAuthService = () => {
        if (!window.authService) {
            setTimeout(waitForAuthService, 100);
            return;
        }
        initDashboard();
    };
    
    waitForAuthService();
});

function initDashboard() {
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutText = document.getElementById('logoutText');
    const logoutLoading = document.getElementById('logoutLoading');

    // Handle logout
    logoutBtn.addEventListener('click', async () => {
        setLoadingState(true);
        
        try {
            const result = await window.authService.logout();
            
            if (result.success) {
                // Redirect to login page
                window.location.href = 'login.html';
            } else {
                alert('Error logging out. Please try again.');
            }
        } catch (error) {
            alert('An unexpected error occurred during logout.');
        }
        
        setLoadingState(false);
    });

    // Utility functions
    function setLoadingState(loading) {
        logoutBtn.disabled = loading;
        if (loading) {
            logoutText.classList.add('hidden');
            logoutLoading.classList.remove('hidden');
        } else {
            logoutText.classList.remove('hidden');
            logoutLoading.classList.add('hidden');
        }
    }

    // Check authentication state and update UI
    window.authService.onAuthStateChange((user) => {
        if (user) {
            // User is authenticated, show their name
            const displayName = user.displayName || user.email.split('@')[0];
            userName.textContent = displayName;
            console.log('Dashboard loaded for user:', displayName);
        } else {
            // User is not authenticated, redirect to login after a small delay
            console.log('No user detected on dashboard, redirecting to login');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    });

    // Add some animation when the page loads
    setTimeout(() => {
        const container = document.querySelector('.container');
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        container.style.transition = 'all 0.5s ease';
        
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        });
    }, 100);
}
