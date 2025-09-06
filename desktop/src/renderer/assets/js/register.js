// Register Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authService to be available
    const waitForAuthService = () => {
        if (!window.authService) {
            setTimeout(waitForAuthService, 100);
            return;
        }
        initRegisterPage();
    };
    
    waitForAuthService();
});

function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const registerBtn = document.getElementById('registerBtn');
    const registerText = document.getElementById('registerText');
    const registerLoading = document.getElementById('registerLoading');
    const goToLogin = document.getElementById('goToLogin');

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        hideMessages();
        
        try {
            const result = await window.authService.register(email, password, displayName);
            
            if (result.success) {
                showSuccess('Account created successfully! Redirecting to dashboard...');
                // Let the auth state listener handle the redirect automatically
                // Keep loading state until redirect happens
            } else {
                showError(result.error);
                setLoadingState(false);
            }
        } catch (error) {
            showError('An unexpected error occurred. Please try again.');
            setLoadingState(false);
        }
    });

    // Handle login link
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });

    // Utility functions
    function setLoadingState(loading) {
        registerBtn.disabled = loading;
        if (loading) {
            registerText.classList.add('hidden');
            registerLoading.classList.remove('hidden');
        } else {
            registerText.classList.remove('hidden');
            registerLoading.classList.add('hidden');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        successMessage.classList.add('hidden');
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    }

    function hideMessages() {
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
    }

    // Check if user is already authenticated
    window.authService.onAuthStateChange((user) => {
        if (user) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    });
}
