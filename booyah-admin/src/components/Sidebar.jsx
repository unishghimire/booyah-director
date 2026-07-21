import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Tag, Settings, Zap, Bell, Receipt, ScrollText } from 'lucide-react';
import { adminFetch } from '../pages/Dashboard';

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/users',         icon: Users,           label: 'USERS' },
  { to: '/subscriptions', icon: CreditCard,      label: 'SUBSCRIPTIONS', badge: 'pendingRequests' },
  { to: '/promo-codes',   icon: Tag,             label: 'PROMO CODES' },
  { to: '/settings',      icon: Settings,        label: 'SETTINGS' },
  { to: '/payment-requests', icon: Receipt,        label: 'PAYMENTS', badge: 'pendingPayments' },
  { to: '/logs',          icon: ScrollText,      label: 'ERROR LOGS' }
];

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      adminFetch('stats').then(d => setPendingCount(d.pendingRequests || 0)).catch(() => {});
      adminFetch('payment-requests').then(d => {
        const pending = (d.requests || []).filter(r => r.status === 'pending' || !r.status);
        setPendingPaymentsCount(pending.length);
      }).catch(() => {});
    };
    fetchPending();
    const t = setInterval(fetchPending, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-56 flex-shrink-0 bg-[#0a0e1a] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#7C3AED]" />
        </div>
        <div>
          <p className="font-orbitron text-[11px] font-black text-white">NEXOVERLAYS</p>
          <p className="font-orbitron text-[7px] text-[#7C3AED] tracking-widest">ADMIN PANEL</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label, badge }) => {
          const badgeCount = badge === 'pendingRequests' ? pendingCount : (badge === 'pendingPayments' ? pendingPaymentsCount : 0);
          return (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isActive
                  ? 'bg-[#7C3AED]/15 text-[#7C3AED]'
                  : 'text-gray-500 hover:text-white hover:bg-white/3'
              }`
            }>
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-orbitron text-[9px] font-black tracking-wider">{label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-orbitron text-[7px] font-black text-black animate-pulse"
                  style={{ background: '#7C3AED' }}>
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="font-orbitron text-[7px] text-gray-700 tracking-widest">NEXOVERLAYS DIRECTOR v2.0</p>
        <p className="font-orbitron text-[6px] text-gray-800 tracking-widest mt-0.5">SECURE ADMIN CONTROL</p>
      </div>
    </div>
  );
}
