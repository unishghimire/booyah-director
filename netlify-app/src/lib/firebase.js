import { initializeApp } from 'firebase/app';
import { getAuth }     from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase project: nexoverlays
// Realtime DB region: asia-southeast1 (Singapore)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'nexoverlays.firebaseapp.com',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL        || 'https://nexoverlays-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'nexoverlays',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'nexoverlays.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '231677184637',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:231677184637:web:2ce67f7777413fe021bf14',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app); // Realtime Database — live overlay, kill feed, tournament data
export const db   = rtdb;             // backward-compat alias
export default app;
