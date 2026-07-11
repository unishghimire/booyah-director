import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

export default function PromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '', discountPercent: 20, discountAmount: 0, description: '',
    maxUses: 100, applicablePlans: ['weekly','monthly','yearly'], expiresAt: ''
  });

  const load = async () => {
    setLoading(true);
    try { const d = await adminFetch('promo-codes'); setCodes(d.promoCodes || []); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const payload = { ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : null };
      await adminFetch('create-promo', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Promo code created');
      setShowCreate(false);
      setForm({ code: '', discountPercent: 20, discountAmount: 0, description: '', maxUses: 100, applicablePlans: ['weekly','monthly','yearly'], expiresAt: '' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const toggle = async (code, active) => {
    try {
      await adminFetch('toggle-promo', { method: 'POST', body: JSON.stringify({ code, active }) });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const del = async (code) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return;
    try {
      await adminFetch('delete-promo', { method: 'DELETE', body: JSON.stringify({ code }) });
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const togglePlan = (plan) => {
    setForm(f => ({
      ...f,
      applicablePlans: f.applicablePlans.includes(plan)
        ? f.applicablePlans.filter(p => p !== plan)
        : [...f.applicablePlans, plan]
    }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">PROMO CODES</h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">{codes.length} ACTIVE CODES</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-orbitron">
            <RefreshCw className="w-3 h-3" /> REFRESH
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-[10px] font-orbitron font-black" style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
            <Plus className="w-3 h-3" /> CREATE CODE
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0a0e1a] overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_120px_100px_100px_100px] text-[9px] font-orbitron font-black text-gray-500 tracking-widest px-4 py-3 border-b border-white/5">
          <div>CODE</div><div>DESCRIPTION</div><div>DISCOUNT</div><div>USES</div><div>STATUS</div><div>ACTIONS</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="h-6 w-6 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-10 font-orbitron text-[10px] text-gray-600">NO PROMO CODES YET</div>
        ) : codes.map(c => (
          <div key={c.id} className="grid grid-cols-[140px_1fr_120px_100px_100px_100px] items-center px-4 py-3 border-b border-white/3">
            <div className="font-orbitron text-[11px] font-black text-[#FF6B00]">{c.code}</div>
            <div className="font-mono text-[9px] text-gray-400 truncate">{c.description || '—'}</div>
            <div className="font-orbitron text-[10px] text-[#22c55e]">
              {c.discountPercent > 0 ? `-${c.discountPercent}%` : ''}
              {c.discountAmount > 0 ? `-NPR${c.discountAmount}` : ''}
            </div>
            <div className="font-orbitron text-[10px] text-gray-400">{c.usedCount}/{c.maxUses}</div>
            <div>
              <button onClick={() => toggle(c.code, !c.active)}>
                {c.active
                  ? <ToggleRight className="w-5 h-5 text-[#22c55e]" />
                  : <ToggleLeft className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
            <div>
              <button onClick={() => del(c.code)} className="p-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="CREATE PROMO CODE" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">CODE</label>
              <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} placeholder="e.g. BOOYAH50"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">DISCOUNT %</label>
                <input type="number" min="0" max="100" value={form.discountPercent}
                  onChange={e => setForm(f => ({...f, discountPercent: +e.target.value, discountAmount: 0}))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
                />
              </div>
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">FLAT DISCOUNT (NPR)</label>
                <input type="number" min="0" value={form.discountAmount}
                  onChange={e => setForm(f => ({...f, discountAmount: +e.target.value, discountPercent: 0}))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
                />
              </div>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">DESCRIPTION</label>
              <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional note"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">MAX USES</label>
                <input type="number" min="1" value={form.maxUses}
                  onChange={e => setForm(f => ({...f, maxUses: +e.target.value}))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
                />
              </div>
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1">EXPIRES AT</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
                />
              </div>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">APPLICABLE PLANS</label>
              <div className="flex gap-2">
                {['weekly','monthly','yearly'].map(plan => (
                  <button key={plan} onClick={() => togglePlan(plan)}
                    className={`px-3 py-1.5 rounded border text-[9px] font-orbitron font-black transition-all ${
                      form.applicablePlans.includes(plan)
                        ? 'border-[#FF6B00]/60 bg-[#FF6B00]/15 text-[#FF6B00]'
                        : 'border-white/10 text-gray-600 hover:border-white/20'
                    }`}>
                    {plan.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={create}
              className="w-full py-3 rounded-lg font-orbitron text-[11px] font-black text-white tracking-widest mt-2"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
              CREATE CODE
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
