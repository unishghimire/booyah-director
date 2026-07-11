import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Tag, Settings, Zap } from 'lucide-react';

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/users',         icon: Users,           label: 'USERS' },
  { to: '/subscriptions', icon: CreditCard,      label: 'SUBSCRIPTIONS' },
  { to: '/promo-codes',   icon: Tag,             label: 'PROMO CODES' },
  { to: '/settings',      icon: Settings,        label: 'SETTINGS' },
];

export default function Sidebar() {
  return (
    <div className="w-56 flex-shrink-0 bg-[#0a0e1a] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#FF6B00]" />
        </div>
        <div>
          <p className="font-orbitron text-[11px] font-black text-white tracking-wider">BOOYAH</p>
          <p className="font-orbitron text-[8px] text-[#FF6B00] tracking-widest">ADMIN PANEL</p>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-[10px] font-orbitron font-black tracking-wider transition-all ${
              isActive
                ? 'bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`
          }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Version */}
      <div className="p-4 border-t border-white/5">
        <p className="text-[8px] font-orbitron text-gray-600 tracking-widest">V1.0.0 — SECURE BUILD</p>
      </div>
    </div>
  );
}
