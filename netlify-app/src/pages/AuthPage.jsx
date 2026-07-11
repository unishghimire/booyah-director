import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        // Register in admin DB
        await fetch('/api/registerUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayName: name }),
        });
        toast.success('Account created! Please wait for access approval.');
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with that email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
      };
      toast.error(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060915] relative overflow-hidden">
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1000px 600px at 50% 30%, rgba(255,107,0,0.08), transparent)' }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <h1 className="font-orbitron text-xl font-black text-white tracking-wider">BOOYAH DIRECTOR</h1>
          <p className="font-orbitron text-[9px] text-[#00D4FF] tracking-widest mt-1">TOURNAMENT BROADCAST SYSTEM</p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden mb-5">
          {[['login','LOG IN',LogIn],['register','SIGN UP',UserPlus]].map(([m,label,Icon]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-orbitron text-[10px] font-black tracking-wider transition-all ${
                mode === m ? 'bg-[#FF6B00] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handle} className="space-y-4 rounded-2xl border border-white/8 bg-[#0a0e1a] p-5">
          {mode === 'register' && (
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">DISPLAY NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Team Manager" required={mode==='register'}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50"
              />
            </div>
          )}
          <div>
            <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
            />
          </div>
          <div>
            <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">PASSWORD</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black text-white tracking-widest disabled:opacity-50"
            style={{ background:'linear-gradient(135deg, #FF6B00, #ff8c00)', boxShadow:'0 4px 20px rgba(255,107,0,0.3)' }}>
            {loading ? 'LOADING...' : mode === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
