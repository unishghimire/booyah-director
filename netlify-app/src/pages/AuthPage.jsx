import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, LogIn, UserPlus, Shield } from 'lucide-react';

/* Animated grid background particle dots */
function GridBg() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {/* Grid lines */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)', backgroundSize:'72px 72px' }} />
      {/* Orange radial glow top */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,107,0,0.1), transparent)' }} />
      {/* Cyan radial glow bottom */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 700px 400px at 50% 100%, rgba(0,212,255,0.06), transparent)' }} />
      {/* Scan line animation */}
      <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,107,0,0.4),transparent)', animation:'scan 4s linear infinite', top:0 }} />
      <style>{`@keyframes scan{0%{top:0}100%{top:100%}}`}</style>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode]     = useState('login');
  const [email, setEmail]   = useState('');
  const [password, setPw]   = useState('');
  const [name, setName]     = useState('');
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      await fetch('/api/registerUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: cred.user.displayName }),
      });
      toast.success('Welcome, ' + (cred.user.displayName || 'Director') + '!');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error(err.message || 'Google sign-in failed');
    } finally { setLoading(false); }
  };

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
        await fetch('/api/registerUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayName: name }),
        });
        toast.success('Account created!');
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account with that email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password must be 6+ characters',
        'auth/invalid-email': 'Invalid email address',
      };
      toast.error(msgs[err.code] || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#060915', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      <GridBg />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:420, padding:'0 20px' }}>
        {/* Logo Badge */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            display:'inline-flex', width:72, height:72, borderRadius:20,
            background:'linear-gradient(135deg,rgba(255,107,0,0.15),rgba(255,107,0,0.05))',
            border:'1px solid rgba(255,107,0,0.4)',
            alignItems:'center', justifyContent:'center', marginBottom:16,
            boxShadow:'0 0 40px rgba(255,107,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <Zap size={32} style={{ color:'#ff4e00' }} />
          </div>
          <h1 style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'0.1em', margin:0 }}>
            BOOYAH <span style={{ background:'linear-gradient(90deg,#ff4e00,#ffaa00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>DIRECTOR</span>
          </h1>
          <p style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(0,212,255,0.7)', letterSpacing:'0.3em', marginTop:6 }}>
            OFFICIAL TOURNAMENT BROADCAST SYSTEM
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:10 }}>
            <Shield size={10} style={{ color:'rgba(255,255,255,0.3)' }} />
            <span style={{ fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em' }}>SECURED ACCESS · FREE FIRE ESPORTS</span>
          </div>
        </div>

        {/* Google Sign-In — primary CTA */}
        <button
          type="button" onClick={handleGoogle} disabled={loading}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            padding:'14px 20px', borderRadius:14, marginBottom:16,
            background:'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,107,0,0.35)',
            boxShadow:'0 0 20px rgba(255,107,0,0.08)',
            fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#fff', letterSpacing:'0.12em',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            transition:'all 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          SIGN IN WITH GOOGLE
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
          <span style={{ fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.25)', letterSpacing:'0.3em' }}>OR EMAIL</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Email/PW card */}
        <div style={{
          borderRadius:16, border:'1px solid rgba(255,255,255,0.07)',
          background:'rgba(10,14,26,0.85)', backdropFilter:'blur(20px)',
          padding:24,
          backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 6px)',
        }}>
          {/* Toggle */}
          <div style={{ display:'flex', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', marginBottom:20 }}>
            {[['login','LOG IN'],['register','SIGN UP']].map(([m,label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:'10px 0', fontFamily:'Orbitron', fontSize:10, fontWeight:900, letterSpacing:'0.1em',
                background: mode === m ? 'linear-gradient(135deg,#ff4e00,#ff4e00)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                border:'none', cursor:'pointer', transition:'all 0.2s',
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', display:'block', marginBottom:6 }}>DISPLAY NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required={mode==='register'}
                  style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', display:'block', marginBottom:6 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#fff', outline:'none', fontFamily:'monospace', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ position:'relative' }}>
              <label style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', display:'block', marginBottom:6 }}>PASSWORD</label>
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPw(e.target.value)} required placeholder="••••••••"
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 40px 10px 14px', fontSize:14, color:'#fff', outline:'none', fontFamily:'monospace', boxSizing:'border-box' }}
              />
              <button type="button" onClick={() => setShow(!show)} style={{ position:'absolute', right:12, bottom:10, background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:0 }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading} style={{
              padding:'13px', borderRadius:10, fontFamily:'Orbitron', fontSize:11, fontWeight:900,
              color:'#fff', letterSpacing:'0.12em', cursor: loading ? 'not-allowed' : 'pointer',
              background:'linear-gradient(135deg,#ff4e00,#ff4e00)', border:'none',
              boxShadow:'0 4px 20px rgba(255,107,0,0.4)', opacity: loading ? 0.6 : 1, transition:'all 0.2s', marginTop:4,
            }}>
              {loading ? 'LOADING...' : mode === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.15)', letterSpacing:'0.15em', marginTop:20 }}>
          BOOYAH DIRECTOR v2.0 · OFFICIAL ESPORTS BROADCAST SYSTEM
        </p>
      </div>
    </div>
  );
}
