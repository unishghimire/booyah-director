import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Check subscription via backend
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
