import React, { useState, useEffect } from 'react';
import { isAuthorized, checkPin, setSession } from '@/lib/auth';
import { Lock, Eye, EyeOff, Shield, Keyboard } from 'lucide-react';

const ROLE_CONFIG = {
  director: {
    label: 'DIRECTOR',
    desc: 'Scene control, overlay management & tournament setup',
    icon: Shield,
    color: '#f97316',
    gradient: 'from-orange-900/40 to-orange-950/20',
    border: 'border-orange-500/30',
  },
  inputer: {
    label: 'DATA INPUTER',
    desc: 'Live game data — kills, eliminations & placements',
    icon: Keyboard,
    color: '#3b82f6',
    gradient: 'from-blue-900/40 to-blue-950/20',
    border: 'border-blue-500/30',
  },
};

export default function PinGate({ role, children }) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin]               = useState('');
  const [error, setError]           = useState('');
  const [show, setShow]             = useState(false);
  const [shake, setShake]           = useState(false);

  useEffect(() => {
    setAuthorized(isAuthorized(role));
  }, [role]);

  if (authorized) return children;

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.director;
  const Icon = cfg.icon;

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => submit(next), 100);
    }
  };

  const submit = (p) => {
    const code = p || pin;
    if (checkPin(role, code)) {
      setSession(role);
      setAuthorized(true);
    } else {
      setError('Incorrect PIN. Try again.');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#09090f]">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className={`relative w-full max-w-sm rounded-2xl border bg-gradient-to-b ${cfg.gradient} ${cfg.border} p-8 shadow-2xl`}
        style={{ boxShadow: `0 0 60px ${cfg.color}22` }}>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2"
            style={{ borderColor: cfg.color + '66', background: cfg.color + '18' }}>
            <Icon className="h-8 w-8" style={{ color: cfg.color }} />
          </div>
          <h2 className="font-orbitron text-lg font-black text-white">{cfg.label}</h2>
          <p className="mt-1 text-xs text-gray-500">{cfg.desc}</p>
        </div>

        {/* PIN dots */}
        <div className={`mb-6 flex justify-center gap-4 transition-all ${shake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all"
              style={{
                borderColor: i < pin.length ? cfg.color : '#374151',
                background: i < pin.length ? cfg.color : 'transparent',
                boxShadow: i < pin.length ? `0 0 8px ${cfg.color}88` : 'none',
              }} />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-xs font-bold text-red-400">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => {
            if (d === '') return <div key={i} />;
            return (
              <button key={i}
                onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : handleDigit(String(d))}
                className="flex h-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-black text-white transition-all hover:bg-white/15 hover:border-white/20 active:scale-95"
                style={d === '⌫' ? { color: '#9ca3af' } : {}}>
                {d}
              </button>
            );
          })}
        </div>

        {/* Lock icon bottom */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
          <Lock className="h-3 w-3" />
          <span className="text-[10px]">Secured access — PIN required</span>
        </div>
      </div>
    </div>
  );
}
