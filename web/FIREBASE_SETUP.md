# Firebase Setup Instructions for Admin Panel

## Environment Variables Required

Create a `.env.local` file in the web directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
API_BASE_URL=http://localhost:5000/api
```

## Firebase Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication

2. **Configure Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Email/Password authentication
   - Create admin user with email: `admin@ecofinds.devally.in`

3. **Get Configuration**
   - Go to Project Settings > General tab
   - Scroll down to "Your apps" section
   - Click on the web app configuration icon
   - Copy the firebaseConfig values to your .env.local file

4. **Security Rules** 
   - The admin panel restricts login to only `admin@ecofinds.devally.in`
   - No other users can access the admin panel

## Admin Panel Features

- **Dashboard**: Overview of users, orders, and revenue
- **Payments Management**: View all payments with filtering options
- **Manual Payments**: Manage pending manual payments and mark as sent
- **Users Management**: View all users and their payment preferences

## Usage

1. Start the backend API server: `cd api && npm start`
2. Start the web application: `cd web && npm run dev`  
3. Visit `http://localhost:3000` 
4. Login with admin@ecofinds.devally.in
5. Access the admin panel features
