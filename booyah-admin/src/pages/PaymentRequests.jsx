import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  RefreshCw,
  Search
} from 'lucide-react';
import Modal from '../components/Modal';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

const PLAN_COLORS = { 
  weekly: '#00D4FF', 
  monthly: '#FF6B00', 
  yearly: '#a855f7' 
};

export default function PaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED'
  
  // Modals state
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveNote, setApproveNote] = useState('');
  
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('payment-requests');
      setRequests(data.requests || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingList = requests.filter(r => r.status === 'pending' || !r.status);
  const approvedList = requests.filter(r => r.status === 'approved');
  const rejectedList = requests.filter(r => r.status === 'rejected');

  const counts = {
    PENDING: pendingList.length,
    APPROVED: approvedList.length,
    REJECTED: rejectedList.length
  };

  const currentList = tab === 'PENDING' ? pendingList : tab === 'APPROVED' ? approvedList : rejectedList;

  const handleApprove = async () => {
    if (!approveModalReq) return;
    setBusy(true);
    try {
      await adminFetch('approve-payment', {
        method: 'POST',
        body: JSON.stringify({ 
          requestId: approveModalReq.id || approveModalReq.requestId, 
          note: approveNote 
        }),
      });
      toast.success('✅ Payment request approved!');
      setApproveModalReq(null);
      setApproveNote('');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Error approving payment');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalReq) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('reject-payment', {
        method: 'POST',
        body: JSON.stringify({ 
          requestId: rejectModalReq.id || rejectModalReq.requestId, 
          reason: rejectReason 
        }),
      });
      toast.success('❌ Payment request rejected');
      setRejectModalReq(null);
      setRejectReason('');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Error rejecting payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060912] text-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#FF6B00]" /> PAYMENT REQUESTS
          </h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">APPROVE OR REJECT MANUAL TRANSACTIONS</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-orbitron disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
        {[
          { key: 'PENDING', label: 'PENDING', color: '#00D4FF' },
          { key: 'APPROVED', label: 'APPROVED', color: '#22c55e' },
          { key: 'REJECTED', label: 'REJECTED', color: '#ef4444' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-wider transition-all"
            style={{
              background: tab === t.key ? `${t.color}20` : 'rgba(255,255,255,0.02)',
              color: tab === t.key ? t.color : 'rgba(255,255,255,0.4)',
              border: `1px solid ${tab === t.key ? t.color + '50' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            {t.label}
            <span 
              className="rounded-full px-2 py-0.5 text-[9px] font-black" 
              style={{ 
                background: tab === t.key ? t.color : 'rgba(255,255,255,0.1)', 
                color: tab === t.key ? '#000' : 'rgba(255,255,255,0.6)' 
              }}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="h-8 w-8 rounded-full border-2 border-[#00D4FF]/20 border-t-[#00D4FF] animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-white/5 bg-[#0a0e1a]/50">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-500" />
          <p className="font-orbitron text-xs text-gray-500 tracking-wider">NO {tab} PAYMENT REQUESTS FOUND</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((req) => {
            const planColor = PLAN_COLORS[req.plan?.toLowerCase()] || '#00D4FF';
            return (
              <div 
                key={req.id || req.requestId} 
                className="rounded-xl border border-white/5 bg-[#0a0e1a] hover:border-white/10 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
              >
                {/* Header info */}
                <div className="p-5 border-b border-white/5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-orbitron text-sm font-black text-white tracking-wide">
                        {req.displayName || 'Anonymous User'}
                      </h3>
                      <p className="font-mono text-[10px] text-gray-500 break-all">{req.email}</p>
                    </div>
                    <span 
                      className="font-orbitron text-[9px] font-black px-2.5 py-0.5 rounded border" 
                      style={{ 
                        background: `${planColor}15`, 
                        color: planColor, 
                        borderColor: `${planColor}30` 
                      }}
                    >
                      {req.plan?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-orbitron text-gray-400">
                    <div>
                      <span className="text-[8px] text-gray-500 block tracking-wider">METHOD</span>
                      <span className="text-white font-bold">{req.paymentMethod || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-500 block tracking-wider">TRANSACTION ID</span>
                      <span className="text-white font-mono font-bold break-all">{req.transactionId || '—'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-orbitron text-gray-400">
                    <div>
                      <span className="text-[8px] text-gray-500 block tracking-wider">AMOUNT</span>
                      <span className="text-[#00D4FF] font-black text-xs">
                        NPR {req.finalPrice}
                        {req.promoDiscount > 0 && (
                          <span className="text-[9px] text-gray-500 font-normal block">
                            (Promo: {req.promoDiscount}% off)
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-500 block tracking-wider">SUBMITTED AT</span>
                      <span className="text-gray-300 font-mono text-[10px]">
                        {req.submittedAt ? new Date(req.submittedAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Optional message/notes from user */}
                  {req.notes && (
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded text-[10px] text-gray-400 italic">
                      "{req.notes}"
                    </div>
                  )}

                  {/* Render rejection or approved feedback if not pending */}
                  {req.status === 'approved' && (
                    <div className="bg-green-500/10 border border-green-500/20 p-2.5 rounded text-[10px] text-green-400 space-y-1">
                      <p className="font-bold">✓ APPROVED</p>
                      {req.adminNote && <p className="text-gray-400">Note: {req.adminNote}</p>}
                    </div>
                  )}
                  {req.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded text-[10px] text-red-400 space-y-1">
                      <p className="font-bold">✗ REJECTED</p>
                      {req.rejectionReason && <p className="text-gray-400">Reason: {req.rejectionReason}</p>}
                    </div>
                  )}
                </div>

                {/* Screenshot & Actions */}
                <div className="p-5 bg-black/40 flex flex-col gap-3">
                  {req.screenshotUrl ? (
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                      <a href={req.screenshotUrl} target="_blank" rel="noopener noreferrer" className="relative group block flex-shrink-0">
                        <img 
                          src={req.screenshotUrl} 
                          alt="Payment Proof" 
                          className="w-12 h-12 rounded object-cover border border-white/10 group-hover:opacity-80 transition-opacity"
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-orbitron text-gray-500 tracking-wider">PAYMENT PROOF</p>
                        <a 
                          href={req.screenshotUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-[#00D4FF] hover:underline font-orbitron font-black mt-1"
                        >
                          VIEW PROOF <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 font-orbitron text-center py-2 bg-white/[0.01] rounded border border-white/5 border-dashed">
                      NO PROOF UPLOADED
                    </div>
                  )}

                  {/* Actions for Pending list only */}
                  {(req.status === 'pending' || !req.status) && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => { setApproveModalReq(req); setApproveNote(''); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-orbitron text-[9px] font-black text-black transition-all hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> APPROVE
                      </button>
                      <button 
                        onClick={() => { setRejectModalReq(req); setRejectReason(''); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-500/30 font-orbitron text-[9px] font-black text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> REJECT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveModalReq && (
        <Modal title="APPROVE PAYMENT REQUEST" onClose={() => setApproveModalReq(null)}>
          <div className="space-y-4">
            <p className="text-[11px] font-orbitron text-gray-400">
              Are you sure you want to approve the subscription for <span className="text-white font-bold">{approveModalReq.email}</span>?
            </p>
            <div className="space-y-1.5">
              <label className="block font-orbitron text-[8px] text-gray-500 tracking-wider">ADMIN NOTE (OPTIONAL)</label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="e.g. Approved via eSewa verification"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#22c55e] h-20 font-sans"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalReq(null)}
                className="px-4 py-2 rounded-lg border border-white/5 font-orbitron text-[9px] font-black text-gray-400 hover:bg-white/5"
              >
                CANCEL
              </button>
              <button
                onClick={handleApprove}
                disabled={busy}
                className="px-4 py-2 rounded-lg font-orbitron text-[9px] font-black text-black bg-[#22c55e] hover:brightness-110 disabled:opacity-50"
              >
                {busy ? 'APPROVING...' : 'CONFIRM APPROVE'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT MODAL */}
      {rejectModalReq && (
        <Modal title="REJECT PAYMENT REQUEST" onClose={() => setRejectModalReq(null)}>
          <div className="space-y-4">
            <p className="text-[11px] font-orbitron text-gray-400">
              Please provide a reason for rejecting <span className="text-white font-bold">{rejectModalReq.email}</span>'s payment request.
            </p>
            <div className="space-y-1.5">
              <label className="block font-orbitron text-[8px] text-gray-500 tracking-wider">REJECTION REASON (REQUIRED)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID mismatch, or proof screenshot is invalid."
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 h-24 font-sans"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-lg border border-white/5 font-orbitron text-[9px] font-black text-gray-400 hover:bg-white/5"
              >
                CANCEL
              </button>
              <button
                onClick={handleReject}
                disabled={busy}
                className="px-4 py-2 rounded-lg font-orbitron text-[9px] font-black text-white bg-red-600 hover:brightness-110 disabled:opacity-50"
              >
                {busy ? 'REJECTING...' : 'CONFIRM REJECT'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
