import React, { useState, useEffect } from 'react';
import { Crown, Zap, Check, LogOut, Tag, Sparkles, Star, AlertCircle, RefreshCw, Upload, CheckCircle2 } from 'lucide-react';
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
  const { user, logout, subscription, refreshSubscription } = useAuth();
  
  // Subscription Status Polling
  const [polling, setPolling] = useState(false);
  const [localSub, setLocalSub] = useState(subscription);

  const fetchStatus = async () => {
    setPolling(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const r = await fetch('/api/checkSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = r.ok ? await r.json() : {};
      setLocalSub(data.subscription || null);
      if (refreshSubscription) {
        await refreshSubscription();
      }
    } catch (err) {
      console.error(err);
    }
    setPolling(false);
  };

  useEffect(() => {
    setLocalSub(subscription);
  }, [subscription]);

  useEffect(() => {
    // Initial fetch and set interval for polling every 10 seconds
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Flow State
  const [step, setStep] = useState(1); // Steps: 1 (Plan & Promo), 2 (Payment Method & Details), 3 (Screenshot Upload & Submitting)
  const [selected, setSelected] = useState('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [checking, setChecking] = useState(false);
  
  // Step 2 & 3 state
  const [paymentMethod, setPaymentMethod] = useState('esewa'); // 'esewa' or 'bank'
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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

  const activePrice = (plan) => {
    if (promoResult && selected === plan.id) {
      return promoResult.discountedPrice;
    }
    return plan.price;
  };

  const getPlanDetails = (id) => PLANS.find(p => p.id === id) || PLANS[1];
  const selectedPlan = getPlanDetails(selected);
  const finalPrice = activePrice(selectedPlan);

  const handleSelectPlan = (planId) => {
    setSelected(planId);
    // Recalculate promo if promo code is active
    setPromoResult(null);
    setPromoCode('');
    setStep(2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFlow = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.error('Transaction ID / Reference is required');
      return;
    }
    if (!screenshotFile) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    setStep(3); // Transition to screenshot upload & submit state
    setIsUploading(true);

    try {
      // Step 3: Upload to ImgBB
      const reader = new FileReader();
      reader.readAsDataURL(screenshotFile);
      const base64String = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      if (!apiKey) {
        throw new Error('ImgBB API key is missing. Contact site administrator.');
      }

      const formData = new FormData();
      formData.append('image', base64String);

      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData?.data?.url) {
        throw new Error(uploadData?.error?.message || 'Failed to upload screenshot to ImgBB');
      }

      const screenshotUrl = uploadData.data.url;
      setIsUploading(false);
      setIsSubmitting(true);

      // Step 4: Submit to backend
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const payload = {
        plan: selected,
        paymentMethod,
        transactionId: transactionId.trim(),
        screenshotUrl,
        promoCode: promoResult ? promoCode.trim().toUpperCase() : '',
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName || user?.email?.split('@')[0] || 'User'
      };

      const submitRes = await fetch('/api/submitPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || 'Failed to submit payment details');
      }

      setStep(4);
      setSubmitMessage('Your payment has been submitted. Admin will verify within 24 hours.');
      toast.success('Payment submitted successfully!');
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'An error occurred during submission');
      setStep(2); // Send back to step 2 on failure so they can try again
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setTransactionId('');
    setScreenshotFile(null);
    setScreenshotPreview('');
    setPromoResult(null);
    setPromoCode('');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#060915', position:'relative', overflow:'hidden', color: '#fff' }}>
      {/* Background Grid Accent */}
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

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 40, fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' }}>
          <span style={{ color: step === 1 ? '#FF6B00' : 'rgba(255,255,255,0.35)' }}>1. PLAN</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>&gt;</span>
          <span style={{ color: step === 2 ? '#FF6B00' : 'rgba(255,255,255,0.35)' }}>2. METHOD</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>&gt;</span>
          <span style={{ color: step === 3 ? '#FF6B00' : 'rgba(255,255,255,0.35)' }}>3. UPLOAD</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>&gt;</span>
          <span style={{ color: step === 4 ? '#00D4FF' : 'rgba(255,255,255,0.35)' }}>4. COMPLETE</span>
        </div>

        {/* Plan Summary shown at step 2, 3, 4 */}
        {step > 1 && (
          <div style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 16, padding: '16px 24px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
            <div>
              <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>SELECTED PLAN</span>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#FF6B00', margin: '4px 0 0', letterSpacing: '0.05em' }}>{selectedPlan.label}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>TOTAL AMOUNT</span>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#00D4FF', margin: '4px 0 0', letterSpacing: '0.05em' }}>NPR {finalPrice}</h3>
            </div>
          </div>
        )}

        {/* STEP 1: Plan Selection */}
        {step === 1 && (
          <>
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom: 40 }}>
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
                    <button onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan.id); }}
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
          </>
        )}

        {/* STEP 2: Payment Method Selection & Form */}
        {step === 2 && (
          <div style={{ background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '32px', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: 24, textAlign: 'center' }}>CHOOSE PAYMENT METHOD</h3>
            
            {/* Payment Options Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              <button onClick={() => setPaymentMethod('esewa')}
                style={{
                  padding: '16px', borderRadius: 12, border: paymentMethod === 'esewa' ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'esewa' ? 'rgba(255,107,0,0.08)' : 'rgba(255,255,255,0.02)',
                  fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                eSewa QR / Wallet
              </button>
              <button onClick={() => setPaymentMethod('bank')}
                style={{
                  padding: '16px', borderRadius: 12, border: paymentMethod === 'bank' ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'bank' ? 'rgba(255,107,0,0.08)' : 'rgba(255,255,255,0.02)',
                  fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                Bank Transfer
              </button>
            </div>

            {/* Details & Payment info */}
            {paymentMethod === 'esewa' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 32, padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>SCAN QR CODE TO PAY</span>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=esewa:nex.unishghimire@gmail.com`} alt="eSewa QR Code"
                  style={{ width: 180, height: 180, borderRadius: 12, border: '4px solid #fff', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }} />
                
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>eSewa Number: <strong style={{ color: '#FF6B00', fontSize: 13 }}>9800000000</strong></p>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Exact Amount: <strong style={{ color: '#00D4FF', fontSize: 13 }}>NPR {finalPrice}</strong></p>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 32, padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color: '#FF6B00', letterSpacing: '0.05em', margin: '0 0 16px 0', textAlign: 'center' }}>BANK ACCOUNT DETAILS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                    <span>Bank Name:</span>
                    <strong style={{ color: '#fff' }}>NIC Asia Bank</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                    <span>Account Name:</span>
                    <strong style={{ color: '#fff' }}>Unish Ghimire</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                    <span>Account Number:</span>
                    <strong style={{ color: '#FF6B00' }}>1234567890</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                    <span>Branch:</span>
                    <strong style={{ color: '#fff' }}>Kathmandu</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                    <span>Amount to Transfer:</span>
                    <strong style={{ color: '#00D4FF' }}>NPR {finalPrice}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmitFlow}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>
                  TRANSACTION ID / REFERENCE (REQUIRED)
                </label>
                <textarea required value={transactionId} onChange={e => setTransactionId(e.target.value)}
                  placeholder="Enter eSewa transaction code or Bank transaction reference"
                  style={{
                    width: '100%', height: '80px', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', resize: 'none', boxSizing: 'border-box',
                    fontFamily: 'monospace', fontSize: 12
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>
                  PAYMENT SCREENSHOT
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <Upload size={14} /> {screenshotFile ? 'CHANGE SCREENSHOT' : 'UPLOAD SCREENSHOT'}
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  {screenshotFile && (
                    <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#22c55e' }}>
                      ✓ {screenshotFile.name.substring(0, 20)}...
                    </span>
                  )}
                </div>

                {screenshotPreview && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>PREVIEW:</p>
                    <img src={screenshotPreview} alt="Screenshot Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
                  }}>
                  BACK TO PLANS
                </button>
                <button type="submit"
                  style={{
                    flex: 2, padding: '14px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#FF6B00,#ff4500)', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: '#fff', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255,107,0,0.3)'
                  }}>
                  SUBMIT PAYMENT DETAILS
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 & 4: Status / Processing / Completed view */}
        {step === 3 && (
          <div style={{ background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
            <RefreshCw size={40} className="animate-spin" style={{ color: '#FF6B00', margin: '0 auto 24px', animation: 'spin 1.5s linear infinite' }} />
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>
              {isUploading ? 'UPLOADING SCREENSHOT...' : 'SUBMITTING FOR VERIFICATION...'}
            </h3>
            <p style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
              Please do not refresh or close this page while we process your request.
            </p>
          </div>
        )}

        {step === 4 && (
          <div style={{ background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
            <CheckCircle2 size={48} style={{ color: '#22c55e', margin: '0 auto 24px' }} />
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: 16 }}>
              SUBMITTED SUCCESSFULLY
            </h3>
            <p style={{ fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', lineHeight: '1.6', maxWidth: 450, margin: '0 auto 24px' }}>
              {submitMessage}
            </p>
            <button onClick={resetFlow}
              style={{
                padding: '12px 30px', borderRadius: 10, border: '1px solid #FF6B00',
                background: 'rgba(255,107,0,0.05)', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: '#FF6B00', cursor: 'pointer'
              }}>
              VIEW PLANS / TRY AGAIN
            </button>
          </div>
        )}

        {/* Subscription Status Section */}
        <div style={{ marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', margin: 0 }}>
              MY SUBSCRIPTION STATUS
            </h3>
            <button onClick={fetchStatus} disabled={polling}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
              }}>
              <RefreshCw size={11} className={polling ? 'animate-spin' : ''} style={{ animation: polling ? 'spin 1.5s linear infinite' : 'none' }} />
              {polling ? 'REFRESHING...' : 'REFRESH'}
            </button>
          </div>

          <div style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: '24px', backdropFilter: 'blur(10px)' }}>
            {!localSub ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CURRENT STATUS</span>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#fff', margin: '4px 0 0' }}>No Active Subscription</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  INACTIVE
                </span>
              </div>
            ) : localSub.status === 'pending' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CURRENT STATUS</span>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#fff', margin: '4px 0 0' }}>Plan: {localSub.plan ? localSub.plan.toUpperCase() : 'N/A'}</p>
                  {localSub.submittedAt && (
                    <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                      Submitted on: {new Date(localSub.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span style={{ padding: '6px 14px', borderRadius: 20, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, background: 'rgba(255,107,0,0.15)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)', boxShadow: '0 0 15px rgba(255,107,0,0.1)' }}>
                  PAYMENT UNDER REVIEW
                </span>
              </div>
            ) : localSub.status === 'active' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CURRENT STATUS</span>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#fff', margin: '4px 0 0' }}>Plan: {localSub.plan ? localSub.plan.toUpperCase() : 'N/A'}</p>
                  {localSub.expiresAt && (
                    <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                      Expires on: {new Date(localSub.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span style={{ padding: '6px 14px', borderRadius: 20, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 15px rgba(34,197,94,0.1)' }}>
                  ACTIVE
                </span>
              </div>
            ) : localSub.status === 'rejected' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CURRENT STATUS</span>
                    <p style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#fff', margin: '4px 0 0' }}>Payment Rejected</p>
                    {localSub.reason && (
                      <p style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#ef4444', margin: '6px 0 0' }}>
                        Reason: {localSub.reason}
                      </p>
                    )}
                  </div>
                  <span style={{ padding: '6px 14px', borderRadius: 20, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    REJECTED
                  </span>
                </div>
                <button onClick={resetFlow}
                  style={{
                    alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: '1px solid #FF6B00',
                    background: 'rgba(255,107,0,0.05)', fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, color: '#FF6B00', cursor: 'pointer'
                  }}>
                  TRY AGAIN
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CURRENT STATUS</span>
                  <p style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#fff', margin: '4px 0 0' }}>Unknown Status</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  {localSub.status}
                </span>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign:'center', fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginTop:32 }}>
          Payments are processed manually via NPR/eSewa/Bank Transfer. Verification takes up to 24 hours.
        </p>
      </div>
      
      {/* Tailwind animation injection keyframe (fallback check) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
