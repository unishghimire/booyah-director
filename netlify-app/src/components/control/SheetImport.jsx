/**
 * SheetImport.jsx — Google Sheets bulk import
 * NO service account needed. Uses Google public CSV export.
 * Sheet must be shared: "Anyone with the link → Viewer"
 *
 * Tab "Teams":   A=Team Name, B=Logo URL, C=Color hex
 * Tab "Players": A=Player Name, B=Team Name, C=Role, D=Photo URL (ImgBB link)
 */
import React, { useState } from 'react';
import { SectionBoundary } from '@/components/ErrorBoundary';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';
import { FileSpreadsheet, Download, ExternalLink, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function SheetImport({ tournamentId, onImported }) {
  const [url, setUrl]         = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) { toast.error('Paste your Google Sheet URL first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await overlayApi.importFromSheet({ sheet_url: url.trim(), tournament_id: tournamentId });
      const msg = `${r.teams_added || 0} teams, ${r.players_added || 0} players imported`;
      setResult({ success: true, message: msg });
      toast.success('Import complete! ' + msg);
      onImported?.();
    } catch (err) {
      toast.error(err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionBoundary>
      <div className="rounded-xl border border-emerald-500/20 bg-[#06120e] p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-orbitron text-xs font-black text-white tracking-wider">GOOGLE SHEETS IMPORT</p>
            <p className="text-[10px] text-gray-500">Bulk-import teams & players — no service account needed</p>
          </div>
          <a href="https://docs.google.com/spreadsheets/create" target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500/70 hover:text-emerald-400 transition-colors">
            <ExternalLink className="h-3 w-3" /> Open Sheets
          </a>
        </div>

        {/* Guide toggle */}
        <button onClick={() => setShowGuide(g => !g)}
          className="w-full flex items-center justify-between rounded-lg border border-white/8 bg-black/30 px-3 py-2.5 text-[10px] font-orbitron text-gray-400 hover:text-white hover:border-white/15 transition-all">
          <span className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-emerald-400" />
            HOW TO SET UP YOUR SHEET
          </span>
          {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showGuide && (
          <div className="rounded-lg border border-emerald-500/15 bg-black/30 p-4 space-y-4 text-[10px]">

            <div className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-orbitron text-[9px] font-black text-emerald-400">1</span>
              <div>
                <p className="font-orbitron font-black text-white mb-1">CREATE YOUR SHEET</p>
                <p className="text-gray-400">Open Google Sheets and create a new spreadsheet. Add two tabs named exactly <span className="font-mono bg-white/10 px-1 rounded">Teams</span> and <span className="font-mono bg-white/10 px-1 rounded">Players</span>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-orbitron text-[9px] font-black text-emerald-400">2</span>
              <div className="w-full">
                <p className="font-orbitron font-black text-white mb-2">FILL COLUMNS (Row 1 = header, skipped automatically)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
                    <p className="font-orbitron font-black text-emerald-400 mb-2">Tab: Teams</p>
                    {[['A','Team Name','required'],['B','Logo URL (ImgBB)','optional'],['C','Color #hex','optional']].map(([c,l,r])=>(
                      <div key={c} className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white">{c}</span>
                        <span className={r==='required'?'text-orange-400 text-[9px]':'text-gray-500 text-[9px]'}>{l}</span>
                        <span className="text-[8px] text-gray-600 ml-auto">{r}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
                    <p className="font-orbitron font-black text-emerald-400 mb-2">Tab: Players</p>
                    {[['A','Player Name','required'],['B','Team Name','required'],['C','Role / IGN','optional'],['D','Photo URL (ImgBB)','optional']].map(([c,l,r])=>(
                      <div key={c} className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white">{c}</span>
                        <span className={r==='required'?'text-orange-400 text-[9px]':'text-gray-500 text-[9px]'}>{l}</span>
                        <span className="text-[8px] text-gray-600 ml-auto">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-gray-600">For Photo URLs — upload player images to imgbb.com and paste the direct link in column D.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-orbitron text-[9px] font-black text-emerald-400">3</span>
              <div>
                <p className="font-orbitron font-black text-white mb-1">MAKE IT PUBLIC</p>
                <p className="text-gray-400">Click <span className="text-white font-bold">Share</span> at the top right → <span className="text-white font-bold">Change to anyone with the link</span> → set permission to <span className="text-emerald-400 font-bold">Viewer</span>. This is required.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-orbitron text-[9px] font-black text-emerald-400">4</span>
              <div>
                <p className="font-orbitron font-black text-white mb-1">PASTE URL BELOW & IMPORT</p>
                <p className="text-gray-400">Copy the URL from your browser (the full <span className="font-mono text-emerald-300/70 text-[9px]">docs.google.com/spreadsheets/d/...</span> link) and paste it in the field below.</p>
              </div>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="flex gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 font-mono transition-colors"
          />
          <button onClick={handleImport} disabled={loading || !url.trim()}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-orbitron font-black text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40 whitespace-nowrap">
            {loading
              ? <div className="h-4 w-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
              : <Download className="h-4 w-4" />}
            {loading ? 'IMPORTING...' : 'IMPORT'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-[11px] ${result.error ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
            {result.error ? <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-orbitron font-black">{result.error || result.message}</p>
              {result.error?.includes('shared publicly') && (
                <p className="mt-1 text-[9px] text-red-300/70">Go to your sheet → Share → "Anyone with the link" → Viewer</p>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionBoundary>
  );
}
