import React, { useState, useEffect } from 'react';
import { Users, CreditCard, TrendingUp, Tag, Activity, Crown, Zap, Bell } from 'lucide-react';
import StatCard from '../components/StatCard';
import { auth } from '../firebase';

async function adminFetch(route, opts = {}) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch(`/api/${route}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}

export { adminFetch };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    Promise.all([
      adminFetch('stats'),
      adminFetch('payment-requests')
    ]).then(([sData, pData]) => {
      setStats(sData);
      const pending = (pData.requests || []).filter(r => r.status === 'pending' || !r.status);
      setPendingPaymentsCount(pending.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-orbitron text-lg font-black text-white tracking-wider">DASHBOARD</h1>
        <p className="font-orbitron text-[9px] text-gray-500 mt-1">REAL-TIME PLATFORM OVERVIEW</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-full border-4 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard title="TOTAL USERS"    value={stats?.totalUsers}   icon={Users}      accent="#00D4FF" />
          <StatCard title="ACTIVE SUBS"    value={stats?.activeUsers}  icon={Crown}      accent="#FF6B00" />
          <StatCard title="TOTAL REVENUE"  value={`NPR ${stats?.totalRevenue?.toLocaleString() ?? 0}`} icon={TrendingUp} accent="#22c55e" />
          <StatCard title="PENDING REQS"   value={stats?.pendingRequests ?? 0} icon={Bell} accent="#facc15" />
        </div>
      )}
      {stats?.pendingRequests > 0 && (
        <div className="mb-4 rounded-xl border border-[#FF6B00]/40 bg-[#FF6B00]/8 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <div>
              <p className="font-orbitron text-[10px] font-black text-[#FF6B00] tracking-wider">
                {stats.pendingRequests} PENDING SUBSCRIPTION REQUEST{stats.pendingRequests > 1 ? 'S' : ''}
              </p>
              <p className="font-orbitron text-[8px] text-gray-500 mt-0.5">Users are waiting for activation — review in Subscriptions</p>
            </div>
          </div>
          <a href="/subscriptions" className="px-4 py-2 rounded-lg font-orbitron text-[9px] font-black text-black" style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
            REVIEW NOW →
          </a>
        </div>
      )}

      {pendingPaymentsCount > 0 && (
        <div className="mb-4 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/8 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
            <div>
              <p className="font-orbitron text-[10px] font-black text-[#00D4FF] tracking-wider">
                {pendingPaymentsCount} PENDING PAYMENT REQUEST{pendingPaymentsCount > 1 ? 'S' : ''}
              </p>
              <p className="font-orbitron text-[8px] text-gray-500 mt-0.5">Users have submitted transaction proof — review in Payment Requests</p>
            </div>
          </div>
          <a href="/payment-requests" className="px-4 py-2 rounded-lg font-orbitron text-[9px] font-black text-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #00b8e6)' }}>
            REVIEW NOW →
          </a>
        </div>
      )}

      {stats?.planBreakdown && (
        <div className="rounded-xl border border-white/5 bg-[#0a0e1a] p-5">
          <h2 className="font-orbitron text-[10px] font-black text-gray-400 tracking-widest mb-4">PLAN BREAKDOWN</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['WEEKLY', 'weekly', '#FF6B00'], ['MONTHLY', 'monthly', '#00D4FF'], ['YEARLY', 'yearly', '#22c55e']].map(([label, key, color]) => (
              <div key={key} className="rounded-lg border border-white/5 bg-black/20 p-4 text-center">
                <p className="font-orbitron text-[8px] text-gray-500 tracking-widest mb-2">{label}</p>
                <p className="font-orbitron text-2xl font-black" style={{ color }}>{stats.planBreakdown[key]}</p>
                <p className="font-orbitron text-[8px] text-gray-600 mt-1">NPR {key === 'weekly' ? 299 : key === 'monthly' ? 599 : 2999}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
