# EcoFinds Mobile App - Authentication System

This document outlines the authentication system implemented for the EcoFinds mobile app using React Native and Firebase Authentication.

## Features Implemented

### 🔐 Authentication Screens

- **Login Screen** (`/auth/login`) - Email and password authentication
- **Register Screen** (`/auth/register`) - User registration with name, email, password, and password confirmation
- **Welcome Screen** (`/welcome`) - Post-authentication landing page

### 🎯 User Experience

- **Loading Screen** - Shows while Firebase initializes
- **Auto-navigation** - Automatically redirects based on authentication state
- **Form Validation** - Input validation for email, password length, password matching
- **Error Handling** - User-friendly error messages for authentication failures

### 🔧 Technical Implementation

- **Firebase Configuration** - Matches desktop app configuration
- **Authentication Context** - React Context for global auth state management
- **Type Safety** - Full TypeScript support with proper Firebase types
- **Responsive Design** - Mobile-optimized UI with consistent styling

## File Structure

```
mobile-app/
├── config/
│   └── firebase.ts              # Firebase configuration
├── contexts/
│   └── AuthContext.tsx          # Authentication context and hooks
├── components/
│   └── LoadingScreen.tsx        # Loading component
├── app/
│   ├── _layout.tsx              # Root layout with auth routing
│   ├── welcome.tsx              # Welcome screen after login
│   ├── auth/
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx         # Registration screen
│   └── (tabs)/
│       └── index.tsx            # Updated home screen with user info
├── google-services.json         # Android Firebase configuration
└── app.json                     # Updated with Firebase plugin
```

## Input Fields (Matching Desktop App)

### Login Screen

- Email Address (email input)
- Password (secure text input)

### Register Screen

- Full Name (text input)
- Email Address (email input)
- Password (secure text input, min 6 characters)
- Confirm Password (secure text input with validation)

## Navigation Flow

1. **App Launch** → Loading Screen → Check Authentication State
2. **Not Authenticated** → Login Screen
3. **Login Success** → Welcome Screen → Can navigate to main app
4. **Registration** → Register Screen → Welcome Screen
5. **Logout** → Returns to Login Screen

## Authentication Features

- ✅ Email/Password Registration
- ✅ Email/Password Sign In
- ✅ User Profile Display Name
- ✅ Sign Out Functionality
- ✅ Authentication State Persistence
- ✅ Automatic Navigation
- ✅ Form Validation
- ✅ Error Handling

## How to Test

1. **Start the Development Server**:

   ```bash
   cd mobile-app
   npm start
   ```

2. **Test Registration Flow**:

   - App should open to Login screen
   - Tap "Create one here" to go to Registration
   - Fill in all fields with valid data
   - Should redirect to Welcome screen after successful registration

3. **Test Login Flow**:

   - From Registration screen, tap "Sign in here" to go to Login
   - Use credentials from previous registration
   - Should redirect to Welcome screen after successful login

4. **Test Main App Navigation**:

   - From Welcome screen, tap "Continue to App"
   - Should navigate to main tabs with user information displayed
   - Home tab shows personalized greeting with user's name/email

5. **Test Sign Out**:
   - In main app, tap "Sign Out" button
   - Should show confirmation dialog
   - Should return to Login screen after confirmation

## Firebase Configuration

The app uses the same Firebase project as the desktop app:

- Project ID: `ecofinds-odoo`
- Authentication methods: Email/Password
- User profile includes display name
- Uses Firebase Web SDK for Expo compatibility (not React Native Firebase)

## Next Steps

After authentication is working:

1. Add more tabs to the main navigation
2. Implement additional Firebase features (Firestore, Storage)
3. Add password reset functionality
4. Implement social authentication (Google, Apple)
5. Add user profile management
6. Implement app-specific features for EcoFinds marketplace

## Troubleshooting

- **Firebase Errors**: Ensure Firebase project is properly configured
- **Navigation Issues**: Check that expo-router is properly set up
- **Build Issues**: May need to run `npx expo prebuild` for Firebase native dependencies
- **Authentication Persistence**: Firebase automatically handles auth state persistence
