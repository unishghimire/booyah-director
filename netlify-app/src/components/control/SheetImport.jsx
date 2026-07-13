import React, { useState } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';
import { FileSpreadsheet, Download, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function SheetImport({ tournamentId, onImported }) {
  const [url, setUrl]       = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleImport = async () => {
    if (!url.trim()) { toast.error('Paste a Google Sheet URL first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await overlayApi.importFromSheet({ sheet_url: url.trim(), tournament_id: tournamentId });
      const msg = `✅ ${r.teams_added || 0} teams, ${r.players_added || 0} players imported`;
      setResult({ ...r, message: msg });
      toast.success(msg);
      onImported?.();
    } catch (err) {
      toast.error(err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-orbitron text-xs font-black text-white tracking-wider">GOOGLE SHEETS IMPORT</p>
          <p className="text-[10px] text-gray-500">Bulk-import teams & players from a spreadsheet</p>
        </div>
        <a
          href="https://docs.google.com/spreadsheets/create"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500/70 hover:text-emerald-400 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open Sheets
        </a>
      </div>

      {/* URL Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleImport()}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 font-mono transition-colors"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-orbitron font-black text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <div className="h-4 w-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? 'IMPORTING...' : 'IMPORT'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mb-3 flex items-center gap-2 rounded-lg p-3 text-[11px] ${
          result.error
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        }`}>
          {result.error
            ? <AlertCircle className="h-4 w-4 flex-shrink-0" />
            : <CheckCircle className="h-4 w-4 flex-shrink-0" />}
          <span className="font-orbitron font-bold">{result.error || result.message}</span>
        </div>
      )}

      {/* Format guide */}
      <div className="rounded-lg bg-black/30 p-3 border border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="h-3 w-3 text-gray-500" />
          <p className="text-[9px] font-orbitron text-gray-500 tracking-wider">REQUIRED SHEET FORMAT</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[9px]">
          <div>
            <p className="text-emerald-400/80 font-bold mb-1 font-orbitron">Tab: "Teams"</p>
            <p className="text-gray-500">A: Team Name <span className="text-gray-600">(required)</span></p>
            <p className="text-gray-500">B: Logo URL <span className="text-gray-600">(optional)</span></p>
            <p className="text-gray-500">C: Color hex <span className="text-gray-600">(optional)</span></p>
          </div>
          <div>
            <p className="text-emerald-400/80 font-bold mb-1 font-orbitron">Tab: "Players"</p>
            <p className="text-gray-500">A: Player Name <span className="text-gray-600">(required)</span></p>
            <p className="text-gray-500">B: Team Name <span className="text-gray-600">(required)</span></p>
            <p className="text-gray-500">C: Role <span className="text-gray-600">(optional)</span></p>
          </div>
        </div>
        <p className="mt-2 text-[9px] text-gray-600">Row 1 = headers (skipped). Share the sheet with your Google service account email.</p>
      </div>
    </div>
  );
}
