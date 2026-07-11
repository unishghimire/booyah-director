import React, { useState, useEffect } from 'react';
import { Paintbrush, RefreshCw, Check, Upload, Monitor, Layers } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: 'Free Fire Orange', accentColor: '#f97316', accentColor2: '#ef4444', bgColor: '#0a0a0f', textColor: '#ffffff' },
  { label: 'PUBG Blue', accentColor: '#3b82f6', accentColor2: '#06b6d4', bgColor: '#050a14', textColor: '#ffffff' },
  { label: 'Valorant Red', accentColor: '#ff4655', accentColor2: '#ff8c00', bgColor: '#0f0f0f', textColor: '#ece8e1' },
  { label: 'Esports Gold', accentColor: '#fbbf24', accentColor2: '#f59e0b', bgColor: '#0d0a00', textColor: '#ffffff' },
  { label: 'Cyber Purple', accentColor: '#a855f7', accentColor2: '#ec4899', bgColor: '#09050f', textColor: '#ffffff' },
  { label: 'Clean White', accentColor: '#ffffff', accentColor2: '#94a3b8', bgColor: '#111827', textColor: '#f8fafc' },
];

const OVERLAY_STYLES = [
  { key: 'default', label: 'Default', desc: 'Sleek dark scoreboard' },
  { key: 'ff_classic', label: 'FF Classic', desc: 'Free Fire tournament style with rank bars & alive counters' },
];

const FONT_STYLES = [
  { key: 'orbitron', label: 'Orbitron', preview: 'ESPORTS' },
  { key: 'rajdhani', label: 'Rajdhani', preview: 'ESPORTS' },
  { key: 'impact', label: 'Impact', preview: 'ESPORTS' },
];

const DEFAULT_DESIGN = {
  accentColor: '#f97316',
  accentColor2: '#ef4444',
  bgColor: '#0a0a0f',
  textColor: '#ffffff',
  tournamentName: 'BOOYAH CUP',
  tournamentSubtitle: 'GRAND FINALS',
  gameLabel: 'GAME',
  logoUrl: '',
  overlayStyle: 'ff_classic',
  fontStyle: 'orbitron',
};

export default function DesignStudio({ onAction }) {
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    overlayApi.getDesign().then(r => {
      setDesign({ ...DEFAULT_DESIGN, ...r.design });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const update = (key, val) => setDesign(d => ({ ...d, [key]: val }));

  const applyPreset = (preset) => {
    setDesign(d => ({ ...d, ...preset }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await overlayApi.saveDesign(design);
      toast.success('Design saved & live!');
      onAction?.();
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-xs text-gray-500">Loading design...</div>;

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paintbrush className="h-4 w-4 text-orange-400" />
        <h3 className="font-orbitron text-xs font-bold text-white">DESIGN STUDIO</h3>
      </div>

      {/* Overlay Style */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Overlay Style</p>
        <div className="space-y-1">
          {OVERLAY_STYLES.map(s => (
            <button
              key={s.key}
              onClick={() => update('overlayStyle', s.key)}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                design.overlayStyle === s.key
                  ? 'bg-orange-500/20 border border-orange-500/50'
                  : 'bg-white/5 border border-transparent hover:bg-white/10'
              }`}
            >
              <Layers className="h-3 w-3 text-orange-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">{s.label}</p>
                <p className="text-[10px] text-gray-500">{s.desc}</p>
              </div>
              {design.overlayStyle === s.key && <Check className="h-3 w-3 text-orange-400 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Quick Presets</p>
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/5 hover:bg-white/10 transition text-left"
            >
              <div className="flex gap-0.5">
                <span className="h-4 w-2 rounded-sm" style={{ background: p.accentColor }} />
                <span className="h-4 w-2 rounded-sm" style={{ background: p.accentColor2 }} />
                <span className="h-4 w-2 rounded-sm" style={{ background: p.bgColor, border: '1px solid #333' }} />
              </div>
              <span className="text-[10px] text-gray-300 truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Custom Colors</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'accentColor', label: 'Primary' },
            { key: 'accentColor2', label: 'Secondary' },
            { key: 'bgColor', label: 'Background' },
            { key: 'textColor', label: 'Text' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="color"
                value={design[key]}
                onChange={e => update(key, e.target.value)}
                className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-[10px] text-gray-400">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Font Style</p>
        <div className="grid grid-cols-3 gap-1">
          {FONT_STYLES.map(f => (
            <button
              key={f.key}
              onClick={() => update('fontStyle', f.key)}
              className={`rounded-lg py-2 text-center transition ${
                design.fontStyle === f.key
                  ? 'bg-orange-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className="text-[11px] font-bold"
                style={{ fontFamily: f.key === 'orbitron' ? 'Orbitron' : f.key === 'rajdhani' ? 'Rajdhani' : 'Impact' }}
              >
                {f.preview}
              </span>
              <p className="text-[9px] mt-0.5 opacity-70">{f.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Branding Text */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Branding</p>
        <div className="space-y-1.5">
          {[
            { key: 'tournamentName', placeholder: 'BOOYAH CUP', label: 'Tournament Name' },
            { key: 'tournamentSubtitle', placeholder: 'GRAND FINALS', label: 'Subtitle' },
            { key: 'gameLabel', placeholder: 'GAME', label: 'Game Label' },
          ].map(({ key, placeholder, label }) => (
            <div key={key}>
              <label className="text-[9px] text-gray-600 uppercase">{label}</label>
              <input
                type="text"
                value={design[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-orange-500/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Logo URL</p>
        <input
          type="text"
          value={design.logoUrl || ''}
          onChange={e => update('logoUrl', e.target.value)}
          placeholder="https://your-logo.png"
          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-orange-500/50"
        />
        {design.logoUrl && (
          <img src={design.logoUrl} alt="logo preview" className="mt-1.5 h-8 rounded" onError={e => e.target.style.display='none'} />
        )}
      </div>

      {/* Live Preview bar */}
      <div
        className="rounded-lg p-2 flex items-center gap-2"
        style={{ background: design.bgColor, borderLeft: `3px solid ${design.accentColor}` }}
      >
        {design.logoUrl && <img src={design.logoUrl} alt="" className="h-5 w-5 rounded object-cover" onError={e => e.target.style.display='none'} />}
        <div>
          <p className="text-[10px] font-black" style={{ color: design.accentColor, fontFamily: design.fontStyle === 'orbitron' ? 'Orbitron' : design.fontStyle === 'rajdhani' ? 'Rajdhani' : 'Impact' }}>
            {design.tournamentName || 'BOOYAH CUP'}
          </p>
          <p className="text-[9px]" style={{ color: design.textColor + '99' }}>{design.tournamentSubtitle || 'GRAND FINALS'}</p>
        </div>
        <span className="ml-auto text-[9px]" style={{ color: design.accentColor2 }}>● LIVE</span>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg py-2 text-xs font-black uppercase tracking-wider transition"
        style={{ background: design.accentColor, color: '#000', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Saving...' : '✓ Apply Design to Overlay'}
      </button>
    </div>
  );
}
