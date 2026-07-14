import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Subscriptions from './pages/Subscriptions';
import PromoCodes from './pages/PromoCodes';
import Settings from './pages/Settings';
import PaymentRequests from './pages/PaymentRequests';
import Bootstrap from './pages/Bootstrap';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

export default function App() {
  const [user, setUser]           = useState(null);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [checking, setChecking]   = useState(true);

  const verifyAdmin = useCallback(async (firebaseUser) => {
    if (!firebaseUser) { setIsAdmin(false); setChecking(false); return; }
    try {
      const token = await firebaseUser.getIdToken();
      const r = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setIsAdmin(true);
      } else {
        // User is logged in but NOT an admin
        setIsAdmin(false);
        toast.error('Access denied — your account is not authorized as admin.');
        await signOut(auth);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        verifyAdmin(u);
      } else {
        setIsAdmin(false);
        setChecking(false);
      }
    });
    return unsub;
  }, [verifyAdmin]);

  if (checking) return (
    <div className="flex h-screen items-center justify-center bg-[#060912] flex-col gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
      <p className="font-orbitron text-[10px] text-gray-600 tracking-widest">VERIFYING CREDENTIALS...</p>
    </div>
  );

  if (!user || !isAdmin) return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/bootstrap" element={<Bootstrap />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );

  return (
    <div className="flex h-screen bg-[#060912] overflow-hidden">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/"              element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/users"         element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/promo-codes"   element={<PromoCodes />} />
            <Route path="/settings"      element={<Settings />} />
            <Route path="/payment-requests" element={<PaymentRequests />} />
            <Route path="/bootstrap"     element={<Bootstrap />} />
            <Route path="*"              element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
