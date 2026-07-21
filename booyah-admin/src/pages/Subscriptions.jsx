import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, TrendingUp, Calendar, Crown, Bell, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

const PLAN_COLORS  = { weekly: '#7C3AED', monthly: '#3B82F6', yearly: '#22c55e' };
const PLAN_PRICES  = { weekly: 299, monthly: 599, yearly: 2999 };
const PLAN_LABELS  = { weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' };

export default function Subscriptions() {
  const [users,    setUsers]    = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('requests'); // 'requests' | 'active' | 'expired'
  const [approveModal, setApproveModal] = useState(null); // request object
  const [discount, setDiscount] = useState(0);
  const [busy,     setBusy]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ud, rd] = await Promise.all([
        adminFetch('users'),
        adminFetch('subscription-requests'),
      ]);
      setUsers(ud.users || []);
      setRequests(rd.requests || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const active   = users.filter(u => u.subscription?.status === 'active' && u.subscription?.expiresAt > now);
  const expiring = active.filter(u => u.subscription.expiresAt - now < 7 * 86400000);
  const expired  = users.filter(u => u.subscription?.expiresAt && u.subscription.expiresAt < now);
  const pending  = requests.filter(r => r.status === 'pending');

  const approve = async () => {
    if (!approveModal) return;
    setBusy(true);
    try {
      await adminFetch('approve-subscription-request', {
        method: 'POST',
        body: JSON.stringify({ requestId: approveModal.id, discountPercent: discount }),
      });
      toast.success(`✅ Subscription approved for ${approveModal.email}`);
      setApproveModal(null);
      setDiscount(0);
      load();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const reject = async (req) => {
    if (!window.confirm(`Reject ${req.plan} request from ${req.email}?`)) return;
    try {
      await adminFetch('reject-subscription-request', {
        method: 'POST',
        body: JSON.stringify({ requestId: req.id }),
      });
      toast.success('Request rejected');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const TABS = [
    { key: 'requests', label: 'PENDING REQUESTS', count: pending.length, color: '#7C3AED' },
    { key: 'active',   label: 'ACTIVE SUBS',      count: active.length,  color: '#22c55e' },
    { key: 'expired',  label: 'EXPIRED',           count: expired.length, color: '#ef4444' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">SUBSCRIPTIONS</h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">PLAN MANAGEMENT & REQUESTS</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-orbitron">
          <RefreshCw className="w-3 h-3" /> REFRESH
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['PENDING',       pending.length,  '#7C3AED', Bell],
          ['ACTIVE',        active.length,   '#22c55e', Crown],
          ['EXPIRING SOON', expiring.length, '#facc15', Calendar],
          ['EXPIRED',       expired.length,  '#ef4444', CreditCard],
        ].map(([title, val, color, Icon]) => (
          <div key={title} className="rounded-xl border border-white/5 bg-[#0a0e1a] p-4" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-orbitron text-[8px] text-gray-500 tracking-widest">{title}</p>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <p className="font-orbitron text-2xl font-black" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-orbitron text-[9px] font-black tracking-wider transition-all"
            style={{
              background: tab === t.key ? `${t.color}20` : 'rgba(255,255,255,0.03)',
              color:      tab === t.key ? t.color : 'rgba(255,255,255,0.4)',
              border:     `1px solid ${tab === t.key ? t.color + '50' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {t.label}
            {t.count > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black" style={{ background: t.color, color: '#000' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-7 w-7 rounded-full border-2 border-[#7C3AED]/20 border-t-[#7C3AED] animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0a0e1a] overflow-hidden">

          {/* ── PENDING REQUESTS ── */}
          {tab === 'requests' && (
            <>
              <div className="px-4 py-3 border-b border-white/5 grid grid-cols-[1fr_100px_80px_120px_160px] font-orbitron text-[8px] font-black text-gray-500 tracking-widest">
                <div>USER</div><div>PLAN</div><div>PRICE</div><div>REQUESTED</div><div>ACTIONS</div>
              </div>
              {pending.length === 0 ? (
                <div className="text-center py-12 font-orbitron text-[10px] text-gray-600">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-20" />
                  NO PENDING REQUESTS
                </div>
              ) : pending.map(r => (
                <div key={r.id} className="grid grid-cols-[1fr_100px_80px_120px_160px] items-center px-4 py-3 border-b border-white/3 hover:bg-white/[0.02]">
                  <div>
                    <p className="font-orbitron text-[11px] text-white">{r.displayName || r.email}</p>
                    <p className="font-mono text-[9px] text-gray-500">{r.email}</p>
                    {r.notes && <p className="font-mono text-[8px] text-gray-600 mt-0.5 italic">"{r.notes}"</p>}
                  </div>
                  <div>
                    <span className="font-orbitron text-[10px] font-black px-2 py-0.5 rounded" style={{ background: `${PLAN_COLORS[r.plan]}20`, color: PLAN_COLORS[r.plan], border: `1px solid ${PLAN_COLORS[r.plan]}40` }}>
                      {PLAN_LABELS[r.plan] || r.plan}
                    </span>
                  </div>
                  <div className="font-orbitron text-[10px] text-gray-300">NPR {PLAN_PRICES[r.plan] || 0}</div>
                  <div className="font-mono text-[9px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setApproveModal(r); setDiscount(0); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-orbitron text-[8px] font-black text-black transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      <CheckCircle className="w-3 h-3" /> APPROVE
                    </button>
                    <button onClick={() => reject(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/30 font-orbitron text-[8px] font-black text-red-400 hover:bg-red-500/10 transition-all">
                      <XCircle className="w-3 h-3" /> REJECT
                    </button>
                  </div>
                </div>
              ))}

              {/* Show past requests below */}
              {requests.filter(r => r.status !== 'pending').length > 0 && (
                <div>
                  <div className="px-4 py-2 border-t border-white/5 font-orbitron text-[8px] text-gray-600 tracking-widest">PAST REQUESTS</div>
                  {requests.filter(r => r.status !== 'pending').map(r => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2 border-b border-white/3 opacity-50">
                      <div>
                        <p className="font-orbitron text-[10px] text-gray-400">{r.email}</p>
                        <p className="font-mono text-[8px] text-gray-600">{r.plan} — {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : ''}</p>
                      </div>
                      <span className="font-orbitron text-[9px] px-2 py-0.5 rounded" style={{
                        color: r.status === 'approved' ? '#22c55e' : '#ef4444',
                        background: r.status === 'approved' ? '#22c55e20' : '#ef444420',
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── ACTIVE SUBS ── */}
          {tab === 'active' && (
            <>
              <div className="px-4 py-3 border-b border-white/5 grid grid-cols-[1fr_100px_80px_120px_80px] font-orbitron text-[8px] font-black text-gray-500 tracking-widest">
                <div>USER</div><div>PLAN</div><div>PRICE</div><div>EXPIRES</div><div>DISC</div>
              </div>
              {active.length === 0 ? (
                <div className="text-center py-12 font-orbitron text-[10px] text-gray-600">NO ACTIVE SUBSCRIBERS</div>
              ) : active.map(u => (
                <div key={u.uid} className="grid grid-cols-[1fr_100px_80px_120px_80px] items-center px-4 py-3 border-b border-white/3 hover:bg-white/[0.02]">
                  <div>
                    <p className="font-orbitron text-[11px] text-white">{u.displayName || u.email}</p>
                    <p className="font-mono text-[9px] text-gray-500">{u.email}</p>
                  </div>
                  <span className="font-orbitron text-[10px] font-black px-2 py-0.5 rounded w-fit" style={{ background: `${PLAN_COLORS[u.subscription.plan]}20`, color: PLAN_COLORS[u.subscription.plan], border: `1px solid ${PLAN_COLORS[u.subscription.plan]}40` }}>
                    {PLAN_LABELS[u.subscription.plan]}
                  </span>
                  <p className="font-orbitron text-[10px] text-gray-300">NPR {u.subscription.price}</p>
                  <p className="font-mono text-[9px] text-gray-400">{new Date(u.subscription.expiresAt).toLocaleDateString()}</p>
                  <p className="font-orbitron text-[10px]" style={{ color: u.subscription.discountPercent > 0 ? '#7C3AED' : '#555' }}>
                    {u.subscription.discountPercent > 0 ? `-${u.subscription.discountPercent}%` : '—'}
                  </p>
                </div>
              ))}
            </>
          )}

          {/* ── EXPIRED ── */}
          {tab === 'expired' && (
            <>
              <div className="px-4 py-3 border-b border-white/5 grid grid-cols-[1fr_100px_120px] font-orbitron text-[8px] font-black text-gray-500 tracking-widest">
                <div>USER</div><div>LAST PLAN</div><div>EXPIRED</div>
              </div>
              {expired.length === 0 ? (
                <div className="text-center py-12 font-orbitron text-[10px] text-gray-600">NO EXPIRED SUBSCRIPTIONS</div>
              ) : expired.map(u => (
                <div key={u.uid} className="grid grid-cols-[1fr_100px_120px] items-center px-4 py-3 border-b border-white/3 hover:bg-white/[0.02] opacity-60">
                  <div>
                    <p className="font-orbitron text-[11px] text-white">{u.displayName || u.email}</p>
                    <p className="font-mono text-[9px] text-gray-500">{u.email}</p>
                  </div>
                  <span className="font-orbitron text-[10px] text-gray-500">{u.subscription?.plan?.toUpperCase() || '—'}</span>
                  <p className="font-mono text-[9px] text-gray-600">{u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toLocaleDateString() : '—'}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <Modal title="APPROVE SUBSCRIPTION" onClose={() => setApproveModal(null)}>
          <div className="space-y-4">
            <div className="rounded-lg bg-black/30 border border-white/5 p-4 space-y-1">
              <p className="font-orbitron text-[9px] text-gray-500">USER</p>
              <p className="font-orbitron text-sm font-black text-white">{approveModal.displayName || approveModal.email}</p>
              <p className="font-mono text-[10px] text-gray-500">{approveModal.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                <p className="font-orbitron text-[8px] text-gray-500 mb-1">PLAN</p>
                <p className="font-orbitron text-sm font-black" style={{ color: PLAN_COLORS[approveModal.plan] }}>
                  {PLAN_LABELS[approveModal.plan]}
                </p>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                <p className="font-orbitron text-[8px] text-gray-500 mb-1">ORIGINAL PRICE</p>
                <p className="font-orbitron text-sm font-black text-white">NPR {PLAN_PRICES[approveModal.plan]}</p>
              </div>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">DISCOUNT % (optional)</label>
              <input type="number" min="0" max="100" value={discount}
                onChange={e => setDiscount(+e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#22c55e]/50 font-mono"
              />
            </div>
            <div className="rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 p-3 font-orbitron text-[10px] flex justify-between">
              <span className="text-gray-400">FINAL PRICE</span>
              <span className="text-[#22c55e] font-black">
                NPR {Math.round(PLAN_PRICES[approveModal.plan] * (1 - discount / 100))}
                {discount > 0 && <span className="ml-2 text-gray-500 line-through font-normal">NPR {PLAN_PRICES[approveModal.plan]}</span>}
              </span>
            </div>
            {approveModal.notes && (
              <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                <p className="font-orbitron text-[8px] text-gray-500 mb-1">USER NOTE</p>
                <p className="font-mono text-[10px] text-gray-400 italic">"{approveModal.notes}"</p>
              </div>
            )}
            <button onClick={approve} disabled={busy}
              className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black tracking-widest text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.25)' }}>
              {busy ? 'APPROVING...' : '✓ APPROVE & ACTIVATE SUBSCRIPTION'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
