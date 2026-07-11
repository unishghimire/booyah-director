import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Calendar, Crown } from 'lucide-react';
import { adminFetch } from './Dashboard';

export default function Subscriptions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('users').then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const now = Date.now();
  const active = users.filter(u => u.subscription?.status === 'active' && u.subscription?.expiresAt > now);
  const expiring = active.filter(u => u.subscription.expiresAt - now < 7 * 86400000);
  const expired = users.filter(u => u.subscription?.status === 'expired' || (u.subscription?.expiresAt && u.subscription.expiresAt < now));

  const PLAN_COLORS = { weekly: '#FF6B00', monthly: '#00D4FF', yearly: '#22c55e' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-orbitron text-lg font-black text-white tracking-wider">SUBSCRIPTIONS</h1>
        <p className="font-orbitron text-[9px] text-gray-500 mt-1">PLAN MANAGEMENT & REVENUE</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['ACTIVE', active.length, '#22c55e', Crown], ['EXPIRING SOON', expiring.length, '#FF6B00', Calendar], ['EXPIRED', expired.length, '#ef4444', CreditCard]].map(([title, val, color, Icon]) => (
          <div key={title} className="rounded-xl border border-white/5 bg-[#0a0e1a] p-5" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-orbitron text-[9px] text-gray-500 tracking-widest">{title}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="font-orbitron text-3xl font-black" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0a0e1a] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 font-orbitron text-[9px] font-black text-gray-500 tracking-widest">
          ACTIVE SUBSCRIBERS
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24"><div className="h-6 w-6 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" /></div>
        ) : active.length === 0 ? (
          <div className="text-center py-10 font-orbitron text-[10px] text-gray-600">NO ACTIVE SUBSCRIBERS</div>
        ) : active.map(u => (
          <div key={u.uid} className="flex items-center justify-between px-4 py-3 border-b border-white/3 hover:bg-white/2">
            <div>
              <p className="font-orbitron text-[11px] text-white">{u.displayName || u.email}</p>
              <p className="font-mono text-[9px] text-gray-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-orbitron text-[10px] font-black px-2 py-0.5 rounded" style={{ background: `${PLAN_COLORS[u.subscription.plan]}20`, color: PLAN_COLORS[u.subscription.plan], border: `1px solid ${PLAN_COLORS[u.subscription.plan]}40` }}>
                {u.subscription.plan?.toUpperCase()}
              </span>
              {u.subscription.discountPercent > 0 && (
                <span className="font-orbitron text-[8px] text-[#FF6B00]">-{u.subscription.discountPercent}% OFF</span>
              )}
              <span className="font-orbitron text-[10px] text-gray-400">NPR {u.subscription.price}</span>
              <span className="font-mono text-[9px] text-gray-500">Expires: {new Date(u.subscription.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
