# EcoFinds Desktop App

A modern Electron application with Firebase authentication, featuring a sleek UI for login, registration, and dashboard functionality.

## 🚀 Features

- **Firebase Authentication**: Secure login and registration
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **Auto-redirect**: Automatic routing based on authentication state
- **Dashboard**: User-friendly dashboard with stats and activity
- **Proper Architecture**: Well-organized folder structure following Electron best practices

## 📁 Project Structure

```
desktop-app/
├── src/
│   ├── main/
│   │   └── main.js              # Main Electron process
│   └── renderer/
│       ├── index.html           # Entry point (loading screen)
│       ├── pages/
│       │   ├── login.html       # Login page
│       │   ├── register.html    # Registration page
│       │   └── dashboard.html   # Dashboard page
│       └── assets/
│           ├── css/
│           │   └── styles.css   # Modern UI styles
│           └── js/
│               ├── firebase-config.js  # Firebase configuration
│               ├── auth-service.js     # Authentication service
│               ├── app.js             # Main app routing logic
│               ├── login.js           # Login page logic
│               ├── register.js        # Registration page logic
│               └── dashboard.js       # Dashboard page logic
├── package.json
└── README.md
```

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication and set up Email/Password provider
4. Get your Firebase configuration from Project Settings

5. Update `src/renderer/assets/js/firebase-config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Run the Application
```bash
npm start
```

## 🎯 How It Works

1. **App Startup**: The app loads `index.html` which shows a loading screen
2. **Authentication Check**: `app.js` checks if the user is authenticated using Firebase
3. **Routing**: 
   - If authenticated → Redirects to Dashboard
   - If not authenticated → Redirects to Login page
4. **User Flow**:
   - New users can register from the login page
   - Existing users can login
   - Logged-in users see the dashboard
   - Users can logout from the dashboard

## 🎨 UI Features

- **Glassmorphism Design**: Modern glass-like effects with backdrop blur
- **Responsive Layout**: Works on different screen sizes
- **Loading States**: Visual feedback during authentication operations
- **Error Handling**: User-friendly error messages
- **Smooth Animations**: CSS transitions for better UX

## 🔐 Security Features

- **Firebase Authentication**: Industry-standard security
- **Form Validation**: Client-side input validation
- **Password Requirements**: Minimum 6 characters
- **Error Handling**: Secure error message display

## 🚀 Next Steps

- Replace demo Firebase config with your actual config
- Add more features to the dashboard
- Implement product browsing and management
- Add user profile management
- Integrate with your backend API

## 📝 Development Notes

- The app uses ES6 modules for better code organization
- Firebase SDK v9+ with modular imports for smaller bundle size
- Modern CSS with custom properties and grid layouts
- Electron security best practices implemented

## 🛠️ Customization

You can customize the app by:
- Modifying colors and styles in `styles.css`
- Adding new pages in the `pages/` directory
- Extending the authentication service with more features
- Adding new dashboard widgets and features

Enjoy building with EcoFinds! 🌱
