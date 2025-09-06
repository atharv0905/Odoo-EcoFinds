// Main App Script - Handles initial routing based on auth state
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen initially
    console.log('EcoFinds app starting...');
    
    // Wait for authService to be available
    const waitForAuthService = () => {
        if (window.authService) {
            console.log('AuthService loaded, setting up auth listener');
            
            // Listen for auth state changes and route accordingly
            window.authService.onAuthStateChange((user) => {
                setTimeout(() => {
                    if (user) {
                        // User is authenticated, go to dashboard
                        console.log('App: User authenticated, redirecting to dashboard');
                        window.location.href = 'pages/dashboard.html';
                    } else {
                        // User is not authenticated, go to login
                        console.log('App: User not authenticated, redirecting to login');
                        window.location.href = 'pages/login.html';
                    }
                }, 2000); // Longer delay to ensure auth state is stable
            });
        } else {
            console.log('Waiting for authService...');
            setTimeout(waitForAuthService, 100);
        }
    };
    
    // Start waiting for auth service
    waitForAuthService();
});
