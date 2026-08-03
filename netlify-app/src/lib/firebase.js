import { initializeApp } from 'firebase/app';
import { getAuth }     from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase project: nexoverlays
// Realtime DB region: asia-southeast1 (Singapore)
// Security: No hardcoded fallbacks — fail fast if env vars missing
const requiredEnv = (key) => {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing Firebase config: ${key}`);
  return val;
};

const firebaseConfig = {
  apiKey:            requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL:       requiredEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId:         requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             requiredEnv('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app); // Realtime Database — live overlay, kill feed, tournament data
export const db   = rtdb;             // backward-compat alias
export default app;