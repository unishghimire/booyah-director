import React, { useState } from 'react';
import { Crown, Zap, Check, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

const PLANS = [
  { id: 'weekly',  label: 'WEEKLY',  price: 299,  period: '/week',   features: ['Full Director Panel','Data Inputer Access','OBS Overlay System','1 Active Tournament'] },
  { id: 'monthly', label: 'MONTHLY', price: 599,  period: '/month',  features: ['Everything in Weekly','Priority Support','Google Sheets Import','Multi-Match Management'], popular: true },
  { id: 'yearly',  label: 'YEARLY',  price: 2999, period: '/year',   features: ['Everything in Monthly','Custom Branding','Firebase Storage','Early Access Features','Best Value — Save 58%'] },
];

export default function PricingPage() {
  const { user, logout } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const checkPromo = async () => {
    if (!promoCode.trim()) { toast.error('Enter a promo code'); return; }
    setCheckingPromo(true);
    try {
      const r = await fetch('/api/validatePromo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), plan: selectedPlan }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error); setPromoResult(null); }
      else { setPromoResult(data); toast.success(`Code applied! Save NPR ${data.savings}`); }
    } catch (e) { toast.error('Could not validate promo code'); }
    setCheckingPromo(false);
  };

  const handleSelect = (planId) => {
    setSelectedPlan(planId);
    setPromoResult(null);
    toast(
      `✅ Plan selected: ${planId.toUpperCase()}\n\nContact your admin to activate your subscription.`,
      { duration: 5000, icon: '📋' }
    );
  };

  const activePrice = (plan) => {
    if (promoResult && selectedPlan === plan.id) return promoResult.discountedPrice;
    return plan.price;
  };

  return (
    <div className="min-h-screen bg-[#060915] relative overflow-hidden">
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <span className="font-orbitron text-sm font-black text-white">BOOYAH DIRECTOR</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-orbitron text-[10px] text-gray-500">{user?.email}</span>
          <button onClick={logout} className="flex items-center gap-1 text-[10px] font-orbitron text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-3 h-3" /> LOGOUT
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <Crown className="w-10 h-10 text-[#FF6B00] mx-auto mb-4" />
          <h1 className="font-orbitron text-3xl font-black text-white tracking-wider mb-2">CHOOSE YOUR PLAN</h1>
          <p className="font-orbitron text-[10px] text-gray-500 tracking-widest">SUBSCRIPTION REQUIRED TO ACCESS BOOYAH DIRECTOR</p>
        </div>

        {/* Promo Code */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE"
            className="w-48 bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono uppercase text-center"
          />
          <button onClick={checkPromo} disabled={checkingPromo}
            className="px-4 py-2 rounded-lg font-orbitron text-[10px] font-black text-white disabled:opacity-50"
            style={{ background:'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
            {checkingPromo ? 'CHECKING...' : 'APPLY'}
          </button>
          {promoResult && (
            <span className="font-orbitron text-[10px] text-[#22c55e]">✓ SAVE NPR {promoResult.savings}!</span>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const price = activePrice(plan);
            const isSelected = selectedPlan === plan.id;
            return (
              <div key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border cursor-pointer transition-all ${
                  plan.popular
                    ? 'border-[#FF6B00]/60 bg-[#0a0e1a]'
                    : 'border-white/8 bg-[#0a0e1a] hover:border-white/15'
                } ${isSelected ? 'ring-2 ring-[#FF6B00]/50' : ''} p-6`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-orbitron text-[8px] font-black text-white" style={{ background:'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
                    MOST POPULAR
                  </div>
                )}
                <p className="font-orbitron text-[9px] font-black tracking-widest text-[#00D4FF] mb-2">{plan.label}</p>
                <div className="mb-1">
                  {promoResult && selectedPlan === plan.id && (
                    <p className="font-orbitron text-sm text-gray-500 line-through">NPR {plan.price}</p>
                  )}
                  <p className="font-orbitron text-4xl font-black text-white">NPR {price}</p>
                  <p className="font-orbitron text-[9px] text-gray-500">{plan.period}</p>
                </div>
                <ul className="my-5 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 font-orbitron text-[9px] text-gray-400">
                      <Check className="w-3 h-3 text-[#22c55e] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSelect(plan.id)}
                  className={`w-full py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-wider transition-all ${
                    plan.popular
                      ? 'text-white'
                      : 'border border-white/20 text-gray-300 hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'
                  }`}
                  style={plan.popular ? { background:'linear-gradient(135deg, #FF6B00, #ff8c00)' } : {}}>
                  {isSelected ? '✓ SELECTED' : 'SELECT PLAN'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center font-orbitron text-[9px] text-gray-600 mt-8">
          After selecting a plan, contact your administrator to activate access. Payments are processed manually.
        </p>
      </div>
    </div>
  );
}
