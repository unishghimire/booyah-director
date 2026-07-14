/**
 * Bootstrap.jsx — First-time super admin setup
 * Route: /bootstrap (public, no auth needed)
 *
 * Flow:
 * 1. User creates a Firebase account via the Login page
 * 2. Gets rejected (not whitelisted yet)
 * 3. Comes here, enters SUPER_ADMIN_SECRET + their Firebase UID + email
 * 4. This calls /api/bootstrap-admin → writes them to /booyah_admin/admins/
 * 5. They can now log in normally
 */
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Shield, Zap, Key, UserPlus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Bootstrap() {
  const [step, setStep]         = useState(1); // 1=enter secret, 2=enter creds, 3=done
  const [envStatus, setEnvStatus] = useState(null);

  useEffect(() => {
    fetch('/api/env-check')
      .then(r => r.json())
      .then(d => setEnvStatus(d))
      .catch(() => setEnvStatus(null));
  }, []);
  const [secret, setSecret]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleBootstrap = async (e) => {
    e.preventDefault();
    if (!email || !password || !secret) return;
    setLoading(true);
    try {
      // Try to sign in first, if that fails try to create the account
      let firebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = cred.user;
      } catch (signInErr) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUser = cred.user;
          toast.success('Firebase account created!');
        } else {
          throw signInErr;
        }
      }

      // Call bootstrap endpoint
      const r = await fetch('/api/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, uid: firebaseUser.uid, email: firebaseUser.email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);

      toast.success('Super admin access granted!');
      setDone(true);
    } catch (err) {
      const msgs = {
        'auth/wrong-password':     'Wrong password for existing account',
        'auth/email-already-in-use': 'Account exists — enter the correct password',
        'auth/weak-password':      'Password must be at least 6 characters',
        'auth/invalid-email':      'Invalid email address',
      };
      const displayMsg = msgs[err.code] || err.message;
      toast.error(displayMsg, { duration: 8000 });
      console.error('[Bootstrap] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="font-orbitron text-xl font-black text-white tracking-wider">ACCESS GRANTED</h1>
        <p className="font-orbitron text-[10px] text-gray-400 tracking-wide leading-relaxed">
          Your account has been registered as Super Admin. You can now log in normally.
        </p>
        <a href="/"
          className="inline-block mt-4 px-6 py-3 rounded-xl font-orbitron text-[11px] font-black text-white tracking-widest"
          style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
          GO TO LOGIN
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center relative overflow-hidden">
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1000px 600px at 50% 40%, rgba(255,107,0,0.08), transparent)' }} />

      <div className="relative z-10 w-full max-w-sm px-4 space-y-5">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 items-center justify-center mb-3">
            <Key className="w-7 h-7 text-[#FF6B00]" />
          </div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">SUPER ADMIN SETUP</h1>
          <p className="font-orbitron text-[9px] text-[#00D4FF] tracking-widest mt-1">FIRST-TIME BOOTSTRAP</p>
        </div>

        <div className="rounded-xl border border-[#FF6B00]/25 bg-[#0a0e1a] p-5 space-y-1 text-[9px] font-orbitron text-gray-500 leading-relaxed tracking-wide">
          <p className="text-[#FF6B00] font-black">⚠️ ONE-TIME SETUP ONLY</p>
          <p>Enter your Vercel <span className="text-white">SUPER_ADMIN_SECRET</span> env variable, then your admin email & password. This registers you as super admin in Firebase.</p>
          <p className="text-gray-600">If you don't have a Firebase account yet, one will be created automatically.</p>

        {/* Env var status */}
        {envStatus && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
            <p className="text-[#00D4FF] font-black text-[9px] tracking-wider">SERVER ENV STATUS:</p>
            {[
              { key: 'FIREBASE_DATABASE_SECRET', label: 'Firebase DB Secret' },
              { key: 'SUPER_ADMIN_SECRET', label: 'Super Admin Secret' },
              { key: 'FIREBASE_DATABASE_URL', label: 'Firebase DB URL' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-500 text-[8px]">{label}</span>
                <span className={`text-[8px] font-black ${envStatus[key] ? 'text-emerald-400' : 'text-red-400'}`}>
                  {envStatus[key] ? '✓ SET' : '✗ MISSING'}
                </span>
              </div>
            ))}
            {!envStatus.FIREBASE_DATABASE_SECRET && (
              <p className="text-red-400 text-[8px] mt-1">⚠ Add FIREBASE_DATABASE_SECRET to Vercel env vars first!</p>
            )}
            {!envStatus.SUPER_ADMIN_SECRET && (
              <p className="text-red-400 text-[8px]">⚠ Add SUPER_ADMIN_SECRET to Vercel env vars first!</p>
            )}
          </div>
        )}
        </div>

        <form onSubmit={handleBootstrap} className="rounded-2xl border border-white/8 bg-[#0a0e1a] p-5 space-y-4">
          {/* Secret */}
          <div>
            <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">
              <Shield className="inline w-3 h-3 mr-1 text-[#FF6B00]" />
              SUPER ADMIN SECRET
            </label>
            <input
              type="password" value={secret} onChange={e => setSecret(e.target.value)} required
              placeholder="From your Vercel env vars"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
            />
          </div>

          {/* Email */}
          <div>
            <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">
              <UserPlus className="inline w-3 h-3 mr-1 text-[#00D4FF]" />
              ADMIN EMAIL
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@booyah.gg"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
            />
          </div>

          {/* Password */}
          <div>
            <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">PASSWORD</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              placeholder="Min 6 characters"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black tracking-widest text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)', boxShadow:'0 4px 20px rgba(255,107,0,0.3)' }}>
            {loading ? 'SETTING UP...' : 'GRANT SUPER ADMIN ACCESS'}
          </button>
        </form>

        <p className="text-center font-orbitron text-[8px] text-gray-700 tracking-wider">
          After setup, this page can be left as-is — it only works with the correct secret.
        </p>
      </div>
    </div>
  );
}
