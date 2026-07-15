import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || 'nex.unishghimire@gmail.com,unishghimire2@gmail.com')
  .split(',').map(e => e.trim().toLowerCase());

const OWNER_SUB = { plan: 'yearly', status: 'active', expiresAt: Date.now() + 315360000000 };

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [shareToken, setShareToken]   = useState(() => sessionStorage.getItem('bd_share_token') || null);
  const [loading, setLoading]         = useState(true);

  const getToken = async (fbUser) => {
    try { return fbUser ? await fbUser.getIdToken(true) : null; } catch { return null; }
  };

  const fetchSubscription = useCallback(async (fbUser) => {
    if (!fbUser) { setSubscription(null); return; }
    if (OWNER_EMAILS.includes(fbUser.email?.toLowerCase())) { setSubscription(OWNER_SUB); return; }
    try {
      const token = await getToken(fbUser);
      const r = await fetch('/api/checkSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : {};
      setSubscription(data.subscription || null);
    } catch { setSubscription(null); }
  }, []);

  const fetchShareToken = useCallback(async (fbUser) => {
    if (!fbUser) return;
    try {
      const token = await getToken(fbUser);
      const r = await fetch('/api/getShareToken', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        if (d.shareToken) {
          setShareToken(d.shareToken);
          sessionStorage.setItem('bd_share_token', d.shareToken);
        }
      }
    } catch {}
  }, []);

  const registerUser = useCallback(async (fbUser) => {
    if (!fbUser) return;
    try {
      const token = await getToken(fbUser);
      await fetch('/api/registerUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Run in parallel for speed
        await registerUser(fbUser);
        await Promise.all([fetchSubscription(fbUser), fetchShareToken(fbUser)]);
      } else {
        setSubscription(null);
        setShareToken(null);
        sessionStorage.removeItem('bd_share_token');
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchSubscription, fetchShareToken, registerUser]);

  return (
    <AuthContext.Provider value={{
      user, subscription, shareToken, loading,
      logout: () => signOut(auth),
      refreshSubscription: () => fetchSubscription(user),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);