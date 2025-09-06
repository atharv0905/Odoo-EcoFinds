import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpov_8-cCbm9fCngmt1kX_Uacp3ZvY0vw",
  authDomain: "ecofinds-odoo.firebaseapp.com",
  projectId: "ecofinds-odoo",
  storageBucket: "ecofinds-odoo.firebasestorage.app",
  messagingSenderId: "873623910045",
  appId: "1:873623910045:web:e4e3d2a10f17851517c674",
  measurementId: "G-H93CS8GXQY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;