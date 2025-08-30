import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration - try environment variables first, fallback to hardcoded
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHLlvRJciUnhXUx_O896hw47GNw0H7uKA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "proof-of-presence-7730f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "proof-of-presence-7730f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "proof-of-presence-7730f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "25376022235",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:25376022235:web:f39aba3d69860a7eff36fe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7WPDQC44YR"
};

console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error('Firebase initialization failed. Please check your configuration.');
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('✅ Firebase services initialized:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export default app;
