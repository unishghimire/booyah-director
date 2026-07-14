import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Ban, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

const STATUS_COLORS = { active: '#22c55e', suspended: '#FF6B00', banned: '#ef4444' };
const PLANS = { weekly: { label: 'Weekly', price: 299 }, monthly: { label: 'Monthly', price: 599 }, yearly: { label: 'Yearly', price: 2999 } };

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [subModal, setSubModal] = useState(null); // uid of user to assign sub
  const [selectedUser, setSelectedUser] = useState(null);
  const [subForm, setSubForm]   = useState({ plan: 'monthly', discountPercent: 0, notes: '' });

  const load = async () => {
    setLoading(true);
    try { const d = await adminFetch('users'); setUsers(d.users || []); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (uid, status) => {
    try {
      await adminFetch('user-status', { method: 'POST', body: JSON.stringify({ uid, status }) });
      toast.success(`User ${status}`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const assignSub = async () => {
    try {
      await adminFetch('assign-subscription', { method: 'POST', body: JSON.stringify({ uid: subModal, ...subForm }) });
      toast.success('Subscription assigned');
      setSubModal(null);
      setSelectedUser(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const revokeSub = async (uid) => {
    if (!window.confirm('Revoke subscription?')) return;
    try {
      await adminFetch('revoke-subscription', { method: 'POST', body: JSON.stringify({ uid }) });
      toast.success('Subscription revoked');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const now = Date.now();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">USERS</h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">{users.length} REGISTERED USERS</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-orbitron">
          <RefreshCw className="w-3 h-3" /> REFRESH
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-[#0a0e1a] overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_160px_180px_180px] text-[9px] font-orbitron font-black text-gray-500 tracking-widest px-4 py-3 border-b border-white/5">
          <div>USER</div><div>STATUS</div><div>PLAN</div><div>EXPIRES</div><div>ACTIONS</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 font-orbitron text-[10px] text-gray-600">NO USERS FOUND</div>
        ) : filtered.map(user => {
          const sub = user.subscription;
          const isActive = sub?.status === 'active' && sub?.expiresAt > now;
          const expiryDate = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—';
          return (
            <div key={user.uid} className="grid grid-cols-[1fr_140px_160px_180px_180px] items-center px-4 py-3 border-b border-white/3 hover:bg-white/2 transition-all">
              <div>
                <p className="font-orbitron text-[11px] text-white">{user.displayName || 'Unknown'}</p>
                <p className="font-mono text-[9px] text-gray-500">{user.email}</p>
              </div>
              <div>
                <span className="px-2 py-0.5 rounded font-orbitron text-[8px] font-black" style={{ background: `${STATUS_COLORS[user.status] || '#666'}20`, color: STATUS_COLORS[user.status] || '#666', border: `1px solid ${STATUS_COLORS[user.status] || '#666'}40` }}>
                  {(user.status || 'PENDING').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="font-orbitron text-[10px]" style={{ color: isActive ? '#22c55e' : '#666' }}>
                  {isActive ? (sub.plan?.toUpperCase() || '—') : 'NO PLAN'}
                </span>
                {isActive && sub.discountPercent > 0 && (
                  <span className="ml-2 text-[8px] text-[#FF6B00]">-{sub.discountPercent}%</span>
                )}
              </div>
              <div className="font-mono text-[10px] text-gray-400">{expiryDate}</div>
              <div className="flex gap-1">
                <button onClick={() => { setSubModal(user.uid); setSelectedUser(user); setSubForm({ plan: sub?.plan || 'monthly', discountPercent: 0, notes: '' }); }}
                  className="p-1.5 rounded border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all font-orbitron text-[9px] font-bold flex items-center gap-1" title="Extend/Assign Subscription">
                  <CreditCard className="w-3 h-3" /> EXTEND
                </button>
                {isActive && (
                  <button onClick={() => revokeSub(user.uid)}
                    className="p-1.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all font-orbitron text-[9px] font-bold flex items-center gap-1" title="Revoke Subscription">
                    <XCircle className="w-3 h-3" /> REVOKE
                  </button>
                )}
                {user.status !== 'active' && (
                  <button onClick={() => setStatus(user.uid, 'active')}
                    className="p-1.5 rounded border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10 transition-all" title="Activate User">
                    <UserCheck className="w-3 h-3" />
                  </button>
                )}
                {user.status !== 'suspended' && (
                  <button onClick={() => setStatus(user.uid, 'suspended')}
                    className="p-1.5 rounded border border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/10 transition-all" title="Suspend User">
                    <UserX className="w-3 h-3" />
                  </button>
                )}
                {user.status !== 'banned' && (
                  <button onClick={() => setStatus(user.uid, 'banned')}
                    className="p-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all" title="Ban User">
                    <Ban className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Modal */}
      {subModal && selectedUser && (
        <Modal title="ASSIGN / EXTEND SUBSCRIPTION" onClose={() => { setSubModal(null); setSelectedUser(null); }}>
          <div className="space-y-4">
            {/* Current subscription details */}
            <div className="rounded-lg bg-black/40 p-3 border border-white/5 space-y-1">
              <p className="font-orbitron text-[9px] text-gray-500 tracking-wider">CURRENT SUBSCRIPTION</p>
              {selectedUser.subscription && selectedUser.subscription.status === 'active' && selectedUser.subscription.expiresAt > Date.now() ? (
                <div>
                  <p className="font-orbitron text-[11px] text-[#22c55e] font-black">
                    ACTIVE: {selectedUser.subscription.plan?.toUpperCase()}
                  </p>
                  <p className="font-mono text-[9px] text-gray-400">
                    Expires: {new Date(selectedUser.subscription.expiresAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="font-orbitron text-[11px] text-gray-400 font-bold">NO ACTIVE SUBSCRIPTION</p>
              )}
            </div>

            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">PLAN</label>
              <select value={subForm.plan} onChange={e => setSubForm(p => ({...p, plan: e.target.value}))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50">
                {Object.entries(PLANS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} — NPR {v.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">DISCOUNT (%)</label>
              <input type="number" min="0" max="100" value={subForm.discountPercent}
                onChange={e => setSubForm(p => ({...p, discountPercent: +e.target.value}))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50"
              />
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">NOTES</label>
              <input value={subForm.notes} onChange={e => setSubForm(p => ({...p, notes: e.target.value}))}
                placeholder="e.g. Beta user, manual payment..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50"
              />
            </div>
            <div className="rounded-lg bg-black/30 p-3 border border-white/5 font-orbitron text-[10px]">
              <span className="text-gray-500">FINAL PRICE: </span>
              <span className="text-[#22c55e] font-black">NPR {Math.round(PLANS[subForm.plan]?.price * (1 - subForm.discountPercent/100))}</span>
              {subForm.discountPercent > 0 && <span className="text-gray-500 ml-2 line-through">NPR {PLANS[subForm.plan]?.price}</span>}
            </div>
            <button onClick={assignSub}
              className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black text-white tracking-widest"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
              ASSIGN SUBSCRIPTION
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
