import React, { useState } from 'react';
import { Crown, Zap, Check, LogOut, Tag, Sparkles, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'weekly', label: 'WEEKLY', price: 299, period: '/week', icon: Zap, color: '#00D4FF',
    features: ['Full Director Panel','Data Inputer Access','OBS Overlay System (9 scenes)','1 Active Tournament'],
  },
  {
    id: 'monthly', label: 'MONTHLY', price: 599, period: '/month', icon: Star, color: '#FF6B00', popular: true,
    features: ['Everything in Weekly','Priority Support','Google Sheets Import','Multi-Match Management','Advanced Kill Feed'],
  },
  {
    id: 'yearly', label: 'YEARLY', price: 2999, period: '/year', icon: Crown, color: '#a855f7',
    badge: 'SAVE 58%',
    features: ['Everything in Monthly','Custom Branding & Logos','All Overlay Themes','Early Access Features','Caster Screen & Profiles','Best Value'],
  },
];

export default function PricingPage() {
  const { user, logout } = useAuth();
  const [promoCode, setPromoCode]   = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [checking, setChecking]     = useState(false);
  const [selected, setSelected]     = useState('monthly');

  const checkPromo = async () => {
    if (!promoCode.trim()) { toast.error('Enter a promo code'); return; }
    setChecking(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const r = await fetch('/api/validatePromo', {
        method:'POST',
        headers:{'Content-Type':'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), plan: selected }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error); setPromoResult(null); }
      else { setPromoResult(data); toast.success(`Code applied! Save NPR ${data.savings}`); }
    } catch { toast.error('Could not validate promo code'); }
    setChecking(false);
  };

  const activePrice = (plan) => promoResult && selected === plan.id ? promoResult.discountedPrice : plan.price;

  return (
    <div style={{ minHeight:'100vh', background:'#060915', position:'relative', overflow:'hidden' }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1200px 600px at 50% 0%, rgba(255,107,0,0.07), transparent)', pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', background:'rgba(6,9,21,0.8)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,107,0,0.15)', border:'1px solid rgba(255,107,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} style={{ color:'#FF6B00' }} />
          </div>
          <span style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:'#fff', letterSpacing:'0.08em' }}>BOOYAH DIRECTOR</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>{user?.email}</span>
          <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer' }}>
            <LogOut size={12} /> LOGOUT
          </button>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:1000, margin:'0 auto', padding:'48px 24px' }}>
        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', width:56, height:56, borderRadius:16, background:'rgba(255,107,0,0.12)', border:'1px solid rgba(255,107,0,0.3)', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 0 30px rgba(255,107,0,0.15)' }}>
            <Crown size={26} style={{ color:'#FF6B00' }} />
          </div>
          <h1 style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'0.08em', margin:'0 0 8px' }}>CHOOSE YOUR PLAN</h1>
          <p style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.3em', margin:0 }}>SUBSCRIPTION REQUIRED TO ACCESS BOOYAH DIRECTOR</p>
        </div>

        {/* Promo Code */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 14px' }}>
            <Tag size={13} style={{ color:'rgba(255,255,255,0.3)' }} />
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE"
              style={{ background:'none', border:'none', outline:'none', fontFamily:'monospace', fontSize:13, color:'#fff', letterSpacing:'0.1em', width:140 }}
            />
          </div>
          <button onClick={checkPromo} disabled={checking}
            style={{ padding:'10px 20px', borderRadius:10, fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'#fff', background:'linear-gradient(135deg,#FF6B00,#ff4500)', border:'none', cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.6 : 1 }}>
            {checking ? 'CHECKING...' : 'APPLY'}
          </button>
          {promoResult && <span style={{ fontFamily:'Orbitron', fontSize:10, color:'#22c55e' }}>✓ SAVE NPR {promoResult.savings}!</span>}
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const price = activePrice(plan);
            const isSelected = selected === plan.id;
            return (
              <div key={plan.id} onClick={() => setSelected(plan.id)}
                style={{
                  position:'relative', borderRadius:20, padding:'28px 24px', cursor:'pointer',
                  background: plan.popular ? 'rgba(255,107,0,0.05)' : 'rgba(10,14,26,0.8)',
                  border: isSelected ? `1px solid ${plan.color}` : plan.popular ? '1px solid rgba(255,107,0,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isSelected ? `0 0 30px ${plan.color}25` : plan.popular ? '0 0 20px rgba(255,107,0,0.08)' : 'none',
                  backdropFilter:'blur(20px)', transition:'all 0.25s',
                  backgroundImage: plan.popular ? 'repeating-linear-gradient(45deg,rgba(255,107,0,0.02) 0,rgba(255,107,0,0.02) 1px,transparent 1px,transparent 8px)' : 'none',
                }}
              >
                {plan.popular && (
                  <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', padding:'4px 16px', borderRadius:20, fontFamily:'Orbitron', fontSize:8, fontWeight:900, color:'#fff', background:'linear-gradient(135deg,#FF6B00,#ff4500)', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(255,107,0,0.4)' }}>
                    MOST POPULAR
                  </div>
                )}
                {plan.badge && (
                  <div style={{ position:'absolute', top:12, right:12, padding:'3px 10px', borderRadius:20, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:plan.color, background:`${plan.color}18`, border:`1px solid ${plan.color}40` }}>
                    {plan.badge}
                  </div>
                )}

                {/* Icon + Label */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${plan.color}15`, border:`1px solid ${plan.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={18} style={{ color:plan.color }} />
                  </div>
                  <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:plan.color, letterSpacing:'0.2em' }}>{plan.label}</span>
                </div>

                {/* Price */}
                <div style={{ marginBottom:20 }}>
                  {promoResult && selected === plan.id && (
                    <p style={{ fontFamily:'Orbitron', fontSize:14, color:'rgba(255,255,255,0.3)', textDecoration:'line-through', margin:'0 0 4px' }}>NPR {plan.price}</p>
                  )}
                  <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:36, fontWeight:900, color:'#fff', lineHeight:1 }}>NPR {price}</span>
                    <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.35)' }}>{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', display:'flex', flexDirection:'column', gap:8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.6)' }}>
                      <Check size={11} style={{ color:plan.color, flexShrink:0 }} /> {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button onClick={(e) => { e.stopPropagation(); setSelected(plan.id); toast(`Plan selected: ${plan.label} — contact admin to activate`, { icon:'📋', duration:5000 }); }}
                  style={{
                    width:'100%', padding:'12px', borderRadius:10,
                    fontFamily:'Orbitron', fontSize:10, fontWeight:900, letterSpacing:'0.12em',
                    color: plan.popular ? '#fff' : plan.color,
                    background: plan.popular ? `linear-gradient(135deg,${plan.color},${plan.color}cc)` : 'transparent',
                    border: plan.popular ? 'none' : `1px solid ${plan.color}50`,
                    cursor:'pointer', transition:'all 0.2s',
                    boxShadow: plan.popular ? `0 4px 16px ${plan.color}40` : 'none',
                  }}>
                  {isSelected ? '✓ SELECTED' : 'SELECT PLAN'}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign:'center', fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginTop:32 }}>
          Contact your administrator after selecting a plan. Payments are processed manually via NPR/eSewa.
        </p>
      </div>
    </div>
  );
}
