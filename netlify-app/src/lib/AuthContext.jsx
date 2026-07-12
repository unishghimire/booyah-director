import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || 'nex.unishghimire@gmail.com')
  .split(',').map(e => e.trim().toLowerCase());

const OWNER_SUB = { plan: 'yearly', status: 'active', expiresAt: Date.now() + 315360000000 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async (fbUser) => {
    if (!fbUser) { setSubscription(null); return; }
    if (OWNER_EMAILS.includes(fbUser.email?.toLowerCase())) { setSubscription(OWNER_SUB); return; }
    try {
      const token = await fbUser.getIdToken(true); // force refresh
      const r = await fetch('/api/checkSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!r.ok) { setSubscription(null); return; }
      const data = await r.json();
      setSubscription(data.subscription || null);
    } catch { setSubscription(null); }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      await fetchSubscription(fbUser);
      setLoading(false);
    });
    return unsub;
  }, [fetchSubscription]);

  const logout = () => signOut(auth);
  const refreshSubscription = () => fetchSubscription(user);

  return (
    <AuthContext.Provider value={{ user, subscription, loading, logout, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
