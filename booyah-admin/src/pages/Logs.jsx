import React, { useState, useEffect } from 'react';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';
import { Trash2, AlertCircle, RefreshCw, Filter, ShieldAlert } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminFetch('logs');
      setLogs(data.logs || []);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const res = await adminFetch('logs', { method: 'DELETE' });
      if (res && res.success) {
        toast.success('All logs cleared successfully');
        setLogs([]);
        setShowConfirm(false);
      } else {
        toast.error('Failed to clear logs');
      }
    } catch (err) {
      toast.error('Error clearing logs');
    } finally {
      setClearing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return (log.level || '').toUpperCase() === filter;
  });

  const getLevelStyle = (level) => {
    const lvl = (level || '').toUpperCase();
    if (lvl === 'ERROR') return { bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30', text: 'text-[#ef4444]' };
    if (lvl === 'WARN') return { bg: 'bg-[#FF6B00]/10', border: 'border-[#FF6B00]/30', text: 'text-[#FF6B00]' };
    return { bg: 'bg-[#00D4FF]/10', border: 'border-[#00D4FF]/30', text: 'text-[#00D4FF]' };
  };

  return (
    <div className="space-y-6 font-orbitron text-white min-h-screen bg-[#060912]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-wider text-white">SYSTEM ERROR LOGS</h1>
            {autoRefresh && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black tracking-widest text-emerald-400">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-500 tracking-widest mt-1">REAL-TIME API MONITORING & ERROR TRACKING</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-wider transition-all ${
              autoRefresh 
                ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF]' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            {autoRefresh ? 'AUTO REFRESH: ON' : 'AUTO REFRESH: OFF'}
          </button>

          {/* Clear Logs Button */}
          {logs.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white text-[9px] font-black tracking-wider transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between bg-[#0a0e1a] border border-white/5 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span className="text-[9px] font-black text-gray-500 tracking-widest mr-2">FILTER LEVEL:</span>
          {['ALL', 'ERROR', 'WARN', 'INFO'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest transition-all ${
                filter === lvl
                  ? 'bg-[#FF6B00] text-black'
                  : 'bg-white/3 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div className="text-[9px] font-black tracking-widest text-gray-500">
          SHOWING {filteredLogs.length} OF {logs.length} ENTRIES
        </div>
      </div>

      {/* Logs List / Loading / Empty */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
          <p className="text-[10px] text-gray-500 tracking-widest">FETCHING DIAGNOSTICS...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0a0e1a] rounded-xl border border-white/5">
          <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-[11px] font-black tracking-wider text-gray-400">NO LOGS AVAILABLE</p>
          <p className="text-[9px] text-gray-600 tracking-widest mt-1">System status is fully operational. All signals clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, idx) => {
            const styles = getLevelStyle(log.level);
            return (
              <div 
                key={log.id || idx} 
                className="rounded-xl border border-white/5 bg-[#0a0e1a] p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-white/10 transition-all"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider ${styles.bg} ${styles.border} ${styles.text}`}>
                      {log.level || 'INFO'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {log.ts ? new Date(log.ts).toLocaleString() : 'UNKNOWN TIME'}
                    </span>
                    {log.route && (
                      <span className="px-2 py-0.5 rounded bg-white/3 border border-white/5 text-[9px] font-mono text-gray-300">
                        {log.route}
                      </span>
                    )}
                    {log.ip && (
                      <span className="text-[9px] text-gray-600 font-mono">
                        IP: {log.ip}
                      </span>
                    )}
                    {log.uid && (
                      <span className="text-[9px] text-gray-600 font-mono truncate max-w-[150px]" title={log.uid}>
                        UID: {log.uid}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[11px] font-mono font-bold text-gray-200 break-all select-all">
                    {log.message || 'No message provided'}
                  </div>

                  {log.stack && (
                    <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-[9px] font-mono text-gray-500 overflow-x-auto max-h-36 overflow-y-auto select-text whitespace-pre-wrap">
                      {log.stack}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0e1a] border border-red-500/30 max-w-md w-full rounded-xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black tracking-wider text-white">PURGE SYSTEM LOGS?</h3>
                <p className="text-[10px] text-gray-500 tracking-wider leading-relaxed">
                  This action is irreversible. All cached diagnostic logs, API failure history, and uncaught exception stacks will be permanently deleted from Firebase.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={clearing}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-[9px] font-black tracking-widest text-gray-400 hover:text-white transition-all"
              >
                CANCEL
              </button>
              <button
                disabled={clearing}
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-black text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5"
              >
                {clearing ? 'PURGING...' : 'CONFIRM PURGE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
