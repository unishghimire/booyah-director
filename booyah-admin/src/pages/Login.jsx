import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Zap, Lock, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

// Access code gate — prevents even seeing the login form
// Set VITE_ADMIN_ACCESS_CODE in Netlify env vars (e.g. a random 12-char string)
// Falls back to a hardcoded default only if env var is missing
const GATE_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'BD-ADMIN-2026';

export default function Login() {
  const [gateCode, setGateCode]     = useState('');
  const [gateOpen, setGateOpen]     = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [show, setShow]             = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleGate = (e) => {
    e.preventDefault();
    if (gateCode.trim() === GATE_CODE) {
      setGateOpen(true);
    } else {
      toast.error('Invalid access code');
      setGateCode('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back, Admin');
    } catch (err) {
      const msgs = {
        'auth/user-not-found':   'No account found',
        'auth/wrong-password':   'Incorrect password',
        'auth/invalid-email':    'Invalid email',
        'auth/too-many-requests':'Too many attempts — try later',
        'auth/invalid-credential': 'Invalid email or password',
      };
      toast.error(msgs[err.code] || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center relative overflow-hidden">
      {/* Grid bg */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px', zIndex:0 }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1000px 600px at 50% 40%, rgba(124,58,237,0.08), transparent)', zIndex:0 }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h1 className="font-orbitron text-xl font-black text-white tracking-wider">NEXOVERLAYS ADMIN</h1>
          <p className="font-orbitron text-[9px] text-[#3B82F6] tracking-widest mt-1">SECURE CONTROL CENTER</p>
        </div>

        {!gateOpen ? (
          /* ── STAGE 1: Access Code Gate ── */
          <form onSubmit={handleGate} className="rounded-2xl border border-[#7C3AED]/30 bg-[#0a0e1a] p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-[#7C3AED]" />
              <p className="font-orbitron text-[10px] text-[#7C3AED] font-black tracking-wider">RESTRICTED ACCESS</p>
            </div>
            <p className="font-orbitron text-[9px] text-gray-500 tracking-wide leading-relaxed">
              This panel is for authorized administrators only. Enter your access code to continue.
            </p>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">ADMIN ACCESS CODE</label>
              <input
                type="password"
                value={gateCode}
                onChange={e => setGateCode(e.target.value)}
                required
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-[#7C3AED]/50 font-mono tracking-widest text-center"
                placeholder="• • • • • • • • • • • •"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black tracking-widest text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
            >
              VERIFY ACCESS
            </button>
            <p className="text-center font-orbitron text-[8px] text-gray-600 tracking-wider">
              <Shield className="inline w-3 h-3 mr-1" /> UNAUTHORIZED ACCESS IS PROHIBITED
            </p>
          </form>
        ) : (
          /* ── STAGE 2: Firebase Email Login ── */
          <form onSubmit={handleLogin} className="rounded-2xl border border-white/8 bg-[#0a0e1a] p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <p className="font-orbitron text-[9px] text-[#22c55e] tracking-wider">ACCESS CODE VERIFIED</p>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">ADMIN EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50 font-mono"
                placeholder="admin@booyah.gg"
              />
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">PASSWORD</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50 font-mono"
                  placeholder="••••••••••••"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black tracking-widest text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS ADMIN PANEL'}
            </button>
            <p className="text-center font-orbitron text-[8px] text-gray-600 tracking-wider">
              <Shield className="inline w-3 h-3 mr-1" /> STAGE 2 — IDENTITY VERIFICATION
            </p>
          </form>
        )}
      </div>

      {/* First-time setup */}
      <div className="relative z-10 mt-6 text-center">
        <Link to="/bootstrap" className="font-orbitron text-[8px] text-gray-700 hover:text-[#7C3AED] tracking-wider transition-colors inline-flex items-center gap-1">
          <Key className="w-2.5 h-2.5" /> First-time setup? Bootstrap super admin
        </Link>
      </div>
    </div>
  );
}
