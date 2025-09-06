// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "./firebase"

export interface User {
  uid: string
  email: string
  displayName?: string
}

class FirebaseAuthService {
  private authCallbacks: Array<(user: User | null) => void> = []
  private currentUser: User | null = null
  private isInitialized = false
  private authStateStable = false

  constructor() {
    this.initAuth()
  }

  private async initAuth() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "[v0] Auth state changed:",
        firebaseUser ? `User logged in: ${firebaseUser.email}` : "User logged out",
      )

      this.currentUser = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null

      // Add stability check for initial load
      if (!this.authStateStable) {
        setTimeout(() => {
          this.authStateStable = true
          this.notifyAuthCallbacks(this.currentUser)
        }, 500)
      } else {
        this.notifyAuthCallbacks(this.currentUser)
      }
    })

    this.isInitialized = true
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || undefined,
    }
  }

  async register(email: string, password: string, displayName?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update user profile with display name
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        })
      }

      return { success: true, user: this.mapFirebaseUser(userCredential.user) }
    } catch (error: any) {
      console.error("[v0] Registration error:", error)
      let errorMessage = "Registration failed"

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists"
          break
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address"
          break
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters"
          break
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled"
          break
        default:
          errorMessage = error.message || "Registration failed"
      }

      return { success: false, error: errorMessage }
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: this.mapFirebaseUser(userCredential.user) }
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      let errorMessage = "Login failed"

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address"
          break
        case "auth/wrong-password":
          errorMessage = "Incorrect password"
          break
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address"
          break
        case "auth/user-disabled":
          errorMessage = "This account has been disabled"
          break
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later"
          break
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password"
          break
        default:
          errorMessage = error.message || "Login failed"
      }

      return { success: false, error: errorMessage }
    }
  }

  async logout() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error: any) {
      console.error("[v0] Logout error:", error)
      return { success: false, error: error.message }
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    // Clear existing callbacks to prevent conflicts
    this.authCallbacks = []
    this.authCallbacks.push(callback)

    // Call immediately with current state if auth is stable
    if (this.authStateStable) {
      callback(this.currentUser)
    }

    // Return unsubscribe function
    return () => {
      this.authCallbacks = this.authCallbacks.filter((cb) => cb !== callback)
    }
  }

  private notifyAuthCallbacks(user: User | null) {
    this.authCallbacks.forEach((callback) => callback(user))
  }
}

// Create singleton instance
export const authService = new FirebaseAuthService()
