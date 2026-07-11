import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back, Admin');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px', zIndex:0 }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1000px 600px at 50% 40%, rgba(255,107,0,0.08), transparent)', zIndex:0 }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <h1 className="font-orbitron text-xl font-black text-white tracking-wider">BOOYAH ADMIN</h1>
          <p className="font-orbitron text-[9px] text-[#00D4FF] tracking-widest mt-1">SECURE CONTROL CENTER</p>
        </div>

        {/* Card */}
        <form onSubmit={handleLogin} className="rounded-2xl border border-white/8 bg-[#0a0e1a] p-6 space-y-4">
          <div style={{ borderTop:'2px solid #FF6B00', borderLeft:'2px solid #FF6B00', borderBottom:'2px solid #00D4FF', borderRight:'2px solid #00D4FF', borderRadius:12, padding:1 }}>
            <div className="rounded-xl bg-[#0a0e1a] p-5 space-y-4">
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">ADMIN EMAIL</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
                  placeholder="admin@booyah.gg"
                />
              </div>
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">PASSWORD</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black tracking-widest text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)', boxShadow: '0 4px 20px rgba(255,107,0,0.3)' }}
              >
                {loading ? 'AUTHENTICATING...' : 'ACCESS ADMIN PANEL'}
              </button>
            </div>
          </div>
          <p className="text-center font-orbitron text-[8px] text-gray-600 tracking-wider">
            <Shield className="inline w-3 h-3 mr-1" /> RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY
          </p>
        </form>
      </div>
    </div>
  );
}
