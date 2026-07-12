/**
 * DESIGN STUDIO — Full custom overlay designer
 * Director can customise every visual aspect of all overlay screens.
 * Changes save to DB and push live to OBS immediately.
 *
 * Sections:
 *  1. Quick Presets  — one-click themed colour sets
 *  2. Colours        — custom primary/secondary/bg/text pickers
 *  3. Font Style     — Orbitron / Rajdhani / Impact
 *  4. Overlay Style  — Default | FF Classic
 *  5. Branding       — tournament name, subtitle, game label, logo
 *  6. Casters        — names + handles for caster screen
 *  7. PIN settings   — change Director / Inputer access PINs
 *  8. Live preview   — mini preview bar
 */
import React, { useState, useEffect } from 'react';
import { overlayApi } from '@/lib/overlayApi';
import { getPins, setPins } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Paintbrush, Check, Layers, Type, Eye, Mic2,
  Lock, RefreshCw, Save, RotateCcw
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

/* ─── Colour presets matching official FF tournament palettes ─── */
const PRESETS = [
  { label: 'FF Orange',   accentColor:'#f97316', accentColor2:'#00d4ff', bgColor:'#060915', textColor:'#ffffff' },
  { label: 'Midnight',    accentColor:'#00d4ff', accentColor2:'#a855f7', bgColor:'#060915', textColor:'#ffffff' },
  { label: 'Valorant',    accentColor:'#ff4655', accentColor2:'#ff8c00', bgColor:'#0f0f0f', textColor:'#ece8e1' },
  { label: 'PUBG Blue',   accentColor:'#3b82f6', accentColor2:'#06b6d4', bgColor:'#050a14', textColor:'#ffffff' },
  { label: 'Esports Gold',accentColor:'#fbbf24', accentColor2:'#f97316', bgColor:'#0d0a00', textColor:'#ffffff' },
  { label: 'Cyber Purple',accentColor:'#a855f7', accentColor2:'#ec4899', bgColor:'#09050f', textColor:'#ffffff' },
  { label: 'Neon Green',  accentColor:'#10b981', accentColor2:'#06b6d4', bgColor:'#020f0a', textColor:'#ffffff' },
  { label: 'Classic Dark',accentColor:'#ffffff', accentColor2:'#94a3b8', bgColor:'#111827', textColor:'#f8fafc' },
];

const FONTS = [
  { key:'orbitron', label:'Orbitron', style:'font-orbitron' },
  { key:'rajdhani', label:'Rajdhani', style:'font-rajdhani' },
  { key:'impact',   label:'Impact',   style:'' },
];

const OVERLAY_STYLES = [
  { key:'ff_classic', label:'FF Classic',   desc:'Free Fire Official tournament style with Garena header, bracket corners, grid bg' },
  { key:'default',    label:'Minimal Dark', desc:'Clean dark overlay without decorative elements' },
];

const DEFAULT_DESIGN = {
  accentColor:'#f97316', accentColor2:'#00d4ff',
  bgColor:'#060915',     textColor:'#ffffff',
  tournamentName:'FF OFFICIAL', tournamentSubtitle:'GRAND FINALS',
  gameLabel:'MATCH', logoUrl:'', overlayStyle:'ff_classic', fontStyle:'orbitron',
  sponsorLogoUrl:'',
  casters:[
    { name:'CASTER 1', handle:'@handle', role:'PLAY-BY-PLAY' },
    { name:'CASTER 2', handle:'@handle', role:'COLOR CASTER' },
  ],
};

function Section({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
      <button onClick={() => setOpen(o=>!o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5">
        <Icon className="h-3.5 w-3.5 text-orange-400" />
        <span className="font-orbitron text-[11px] font-black text-white tracking-wider">{title}</span>
        <span className="ml-auto text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 hover:bg-white/5 transition-all">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
        <p className="font-mono text-[10px] text-gray-600">{value}</p>
      </div>
    </label>
  );
}

export default function DesignStudio({ onAction }) {
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // PIN change state
  const [pins, setPinsState] = useState({ director:'', inputer:'' });
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    overlayApi.getDesign()
      .then(r => { setDesign({ ...DEFAULT_DESIGN, ...r.design }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const upd = (key, val) => setDesign(d => ({ ...d, [key]: val }));

  const updCaster = (i, key, val) => {
    const c = [...(design.casters || [{},{},{}])];
    c[i] = { ...c[i], [key]: val };
    upd('casters', c);
  };

  const save = async () => {
    setSaving(true);
    try {
      await overlayApi.saveDesign(design);
      toast.success('🎨 Design saved & live on overlay!');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const reset = () => { setDesign(DEFAULT_DESIGN); toast('Design reset to defaults'); };

  const savePins = () => {
    const current = getPins();
    const next = { ...current };
    if (pins.director?.length === 4) next.director = pins.director;
    if (pins.inputer?.length === 4)  next.inputer  = pins.inputer;
    setPins(next);
    setPinsState({ director:'', inputer:'' });
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
    toast.success('PINs updated! Refresh each panel to lock again.');
  };

  if (loading) return <div className="p-6 text-xs text-gray-600">Loading design settings…</div>;

  return (
    <div className="space-y-4">
      {/* ── PRESETS ── */}
      <Section title="QUICK PRESETS" icon={Paintbrush}>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => setDesign(d => ({ ...d, ...p }))}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-left hover:bg-white/10 hover:border-white/20 transition-all group">
              <div className="flex gap-1 flex-shrink-0">
                <span className="h-5 w-3 rounded-sm" style={{ background: p.accentColor }} />
                <span className="h-5 w-3 rounded-sm" style={{ background: p.accentColor2 }} />
                <span className="h-5 w-3 rounded-sm border border-white/10" style={{ background: p.bgColor }} />
              </div>
              <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── COLOURS ── */}
      <Section title="CUSTOM COLOURS" icon={Paintbrush}>
        <div className="grid grid-cols-2 gap-2">
          <ColorPicker label="Primary Accent" value={design.accentColor} onChange={v => upd('accentColor', v)} />
          <ColorPicker label="Secondary Accent" value={design.accentColor2} onChange={v => upd('accentColor2', v)} />
          <ColorPicker label="Background" value={design.bgColor} onChange={v => upd('bgColor', v)} />
          <ColorPicker label="Text" value={design.textColor} onChange={v => upd('textColor', v)} />
        </div>
      </Section>

      {/* ── FONT ── */}
      <Section title="FONT STYLE" icon={Type}>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map(f => (
            <button key={f.key} onClick={() => upd('fontStyle', f.key)}
              className={`rounded-xl py-3 text-center transition-all border ${design.fontStyle === f.key ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              <p className="text-base font-black" style={{ fontFamily: f.key === 'impact' ? 'Impact' : f.key === 'rajdhani' ? 'Rajdhani' : 'Orbitron' }}>ESPORT</p>
              <p className="mt-0.5 text-[9px] opacity-70">{f.label}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── OVERLAY STYLE ── */}
      <Section title="OVERLAY STYLE" icon={Layers}>
        <div className="space-y-2">
          {OVERLAY_STYLES.map(s => (
            <button key={s.key} onClick={() => upd('overlayStyle', s.key)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${design.overlayStyle === s.key ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              <div className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 ${design.overlayStyle === s.key ? 'border-orange-500 bg-orange-500' : 'border-gray-600'}`} />
              <div>
                <p className="font-orbitron text-xs font-black text-white">{s.label}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{s.desc}</p>
              </div>
              {design.overlayStyle === s.key && <Check className="ml-auto h-4 w-4 text-orange-400" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── BRANDING ── */}
      <Section title="BRANDING" icon={Eye}>
        <div className="space-y-3">
          {[
            { key:'tournamentName',     label:'Tournament Name',    placeholder:'FF OFFICIAL' },
            { key:'tournamentSubtitle', label:'Subtitle / Edition', placeholder:'GRAND FINALS' },
            { key:'gameLabel',          label:'Game Label',         placeholder:'MATCH' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">{label}</label>
              <input value={design[key] || ''} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/40 transition-colors" />
            </div>
          ))}

          <ImageUpload
            value={design.logoUrl || ''}
            onChange={(url) => upd('logoUrl', url)}
            label="Tournament Logo (shows in scoreboard header & overlay screens)"
            name="tournament-logo"
          />
          <ImageUpload
            value={design.sponsorLogoUrl || ''}
            onChange={(url) => upd('sponsorLogoUrl', url)}
            label="Sponsor Logo (shows in casters screen)"
            name="sponsor-logo"
          />
        </div>
      </Section>

      {/* ── CASTERS ── */}
      <Section title="CASTERS" icon={Mic2}>
        <div className="space-y-3">
          {(design.casters || [{},{},{}]).slice(0,3).map((c, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Caster {i + 1}</p>
              <div className="grid grid-cols-3 gap-2">
                <input value={c.name || ''} onChange={e => updCaster(i, 'name', e.target.value)}
                  placeholder={`Name ${i+1}`}
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
                <input value={c.handle || ''} onChange={e => updCaster(i, 'handle', e.target.value)}
                  placeholder="@handle"
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
                <input value={c.role || ''} onChange={e => updCaster(i, 'role', e.target.value)}
                  placeholder="PLAY-BY-PLAY"
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
              </div>
              <ImageUpload
                value={c.photo || ''}
                onChange={(url) => updCaster(i, 'photo', url)}
                label={`Caster ${i+1} Photo (shows in casters overlay)`}
                name={`caster-${i+1}-photo`}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── PIN SETTINGS ── */}
      <Section title="ACCESS PINs" icon={Lock}>
        <p className="mb-3 text-[10px] text-gray-500">Enter a new 4-digit PIN to change it. Leave blank to keep current.</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-orange-500">Director PIN</label>
            <input type="password" value={pins.director} onChange={e => { if (e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) setPinsState(p=>({...p, director:e.target.value})); }}
              placeholder="New 4-digit PIN" maxLength={4}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-black text-white placeholder-gray-600 outline-none focus:border-orange-500/40 tracking-[0.5em]" />
          </div>
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-blue-400">Inputer PIN</label>
            <input type="password" value={pins.inputer} onChange={e => { if (e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) setPinsState(p=>({...p, inputer:e.target.value})); }}
              placeholder="New 4-digit PIN" maxLength={4}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-black text-white placeholder-gray-600 outline-none focus:border-blue-500/40 tracking-[0.5em]" />
          </div>
        </div>
        <button onClick={savePins}
          className={`w-full rounded-xl py-2.5 text-sm font-black transition-all ${pinSaved ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
          {pinSaved ? '✓ PINs Updated!' : 'Save PINs'}
        </button>
        <p className="mt-2 text-[9px] text-gray-700">Default: Director=1234, Inputer=5678</p>
      </Section>

      {/* ── LIVE PREVIEW ── */}
      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: design.accentColor + '55' }}>
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: `linear-gradient(135deg, ${design.accentColor}22, ${design.bgColor}, ${design.accentColor2}22)`, borderBottom: `1px solid ${design.accentColor}33` }}>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full" style={{ background: design.accentColor + '44' }}>
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-[8px]" style={{ color: design.accentColor }}>G</span>
              </div>
            </div>
            <span className="font-orbitron text-[9px] font-black" style={{ color: design.accentColor }}>GARENA</span>
          </div>
          <span className="font-orbitron text-[10px] font-black" style={{ color: design.textColor, fontFamily: design.fontStyle === 'impact' ? 'Impact' : design.fontStyle === 'rajdhani' ? 'Rajdhani' : 'Orbitron' }}>
            {design.tournamentName || 'FF OFFICIAL'}
          </span>
          <span className="font-orbitron text-[9px] font-black" style={{ color: design.accentColor2 }}>
            {design.tournamentName || 'FF OFFICIAL'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: design.bgColor }}>
          <div style={{ color: design.textColor + '88', fontSize: 10 }}>RANK · LOGO · TEAM NAME · KILLS · BOOYAH · TOTAL POINTS</div>
          <div className="flex gap-0.5">
            {[1,1,1,0].map((a,i) => <div key={i} className="rounded-sm" style={{ width:4, height:a?12:6, background:a?design.accentColor:design.accentColor+'33', marginTop:a?0:3 }} />)}
          </div>
        </div>
      </div>

      {/* ── SAVE / RESET ── */}
      <div className="flex gap-3">
        <button onClick={reset}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={save} disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-black transition-all disabled:opacity-50"
          style={{ background: saving ? design.accentColor + 'aa' : design.accentColor }}>
          {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Apply Design to Overlay</>}
        </button>
      </div>
    </div>
  );
}
