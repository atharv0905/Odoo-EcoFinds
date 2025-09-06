// Login Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authService to be available
    const waitForAuthService = () => {
        if (!window.authService) {
            setTimeout(waitForAuthService, 100);
            return;
        }
        initLoginPage();
    };
    
    waitForAuthService();
});

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');
    const goToRegister = document.getElementById('goToRegister');

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        setLoadingState(true);
        hideError();
        
        try {
            const result = await window.authService.login(email, password);
            
            if (result.success) {
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('An unexpected error occurred. Please try again.');
        }
        
        setLoadingState(false);
    });

    // Handle register link
    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'register.html';
    });

    // Utility functions
    function setLoadingState(loading) {
        loginBtn.disabled = loading;
        if (loading) {
            loginText.classList.add('hidden');
            loginLoading.classList.remove('hidden');
        } else {
            loginText.classList.remove('hidden');
            loginLoading.classList.add('hidden');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Check if user is already authenticated
    window.authService.onAuthStateChange((user) => {
        if (user) {
            // User is already logged in, redirect to dashboard
            console.log('User already authenticated, redirecting to dashboard');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    });
}
