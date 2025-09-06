// Authentication Service using compat version
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authCallbacks = [];
    this.auth = window.firebaseAuth;
    this.isInitialized = false;
    this.authStateStable = false;
    
    // Wait for auth to be available then listen for auth state changes
    this.initAuth();
  }

  async initAuth() {
    // Wait for Firebase to be available
    let attempts = 0;
    while (!window.firebaseAuth && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.firebaseAuth) {
      this.auth = window.firebaseAuth;
      
      // Listen for auth state changes with stability check
      this.auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
        this.currentUser = user;
        
        // Add a small delay to ensure auth state is stable
        if (!this.authStateStable) {
          setTimeout(() => {
            this.authStateStable = true;
            this.notifyAuthCallbacks(user);
          }, 500);
        } else {
          this.notifyAuthCallbacks(user);
        }
      });
      
      this.isInitialized = true;
    } else {
      console.error('Firebase Auth not available after waiting');
    }
  }

  // Register new user
  async register(email, password, displayName) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Update user profile with display name
      if (displayName && userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: displayName
        });
      }
      
      // Create user in backend database
      try {
        if (window.apiService) {
          await window.apiService.createUser({
            email: email,
            name: displayName || userCredential.user.displayName || 'User'
          });
          console.log('User created in backend database');
        }
      } catch (apiError) {
        console.warn('Failed to create user in backend database:', apiError.message);
        // Don't fail the registration if API call fails - user can try again later
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Login existing user
  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    // Clear existing callbacks to prevent conflicts between pages
    this.authCallbacks = [];
    this.authCallbacks.push(callback);
    
    // Call immediately with current state if auth is ready and stable
    if (this.auth && this.authStateStable) {
      callback(this.currentUser);
    }
  }

  // Notify all callbacks of auth state change
  notifyAuthCallbacks(user) {
    this.authCallbacks.forEach(callback => callback(user));
  }
}

// Create singleton instance and make it globally available
window.authService = new AuthService();
