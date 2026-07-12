import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

// Owner emails that always bypass subscription check
// Set VITE_OWNER_EMAILS as comma-separated list in Vercel env vars
// Falls back to hardcoded owner email
const OWNER_EMAILS = (
  import.meta.env.VITE_OWNER_EMAILS || 'nex.unishghimire@gmail.com'
).split(',').map(e => e.trim().toLowerCase());

const OWNER_SUBSCRIPTION = {
  plan: 'yearly',
  status: 'active',
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 * 10, // 10 years
};

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Owner always gets full access — no API call needed
        if (OWNER_EMAILS.includes(fbUser.email?.toLowerCase())) {
          setSubscription(OWNER_SUBSCRIPTION);
          setLoading(false);
          return;
        }
        // Check subscription via backend for regular users
        try {
          const token = await fbUser.getIdToken();
          const r = await fetch('/api/checkSubscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          });
          const data = r.ok ? await r.json() : {};
          setSubscription(data.subscription || null);
        } catch (e) {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, subscription, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
