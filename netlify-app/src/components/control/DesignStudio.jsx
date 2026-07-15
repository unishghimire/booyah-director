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
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { overlayApi } from '@/lib/overlayApi';
import { getPins, setPins } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Paintbrush, Check, Layers, Type, Eye, Mic2,
  Lock, RefreshCw, Save, RotateCcw, Map,
  Image, FolderOpen, BotMessageSquare, Send, TestTube2, Link, CheckCircle2, Trash2, Trophy, Users, BarChart3, Star
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { MAPS } from '@/lib/maps';

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
  {
    key: 'default',
    label: 'Dual Border (Default)',
    desc: 'Orange & cyan dual-corner glass panels. The original AAA esports style.',
    preview: { p:'#FF6B00', s:'#00D4FF', corner:'dual' },
  },
  {
    key: 'neon',
    label: 'Neon Cyber',
    desc: 'Neon green & purple glowing edges on a deep-black cyber grid.',
    preview: { p:'#00FF88', s:'#BF00FF', corner:'glow' },
  },
  {
    key: 'military',
    label: 'Military Tactical',
    desc: 'Olive & gold tactical HUD with rangefinder tick marks.',
    preview: { p:'#9ABF30', s:'#C8A850', corner:'tick' },
  },
  {
    key: 'minimal',
    label: 'Minimal Editorial',
    desc: 'Clean white-on-black typographic layout. No decorative elements.',
    preview: { p:'#FFFFFF', s:'#888888', corner:'none' },
  },
  {
    key: 'retro',
    label: 'Retro Arcade',
    desc: 'Red & gold CRT scanline aesthetic with bold solid borders.',
    preview: { p:'#FF3030', s:'#FFD700', corner:'rect' },
  },
];

const DEFAULT_DESIGN = {
  accentColor:'#f97316', accentColor2:'#00d4ff',
  bgColor:'#060915',     textColor:'#ffffff',
  tournamentName:'FF OFFICIAL', tournamentSubtitle:'GRAND FINALS',
  gameLabel:'MATCH', logoUrl:'', overlayStyle:'default', fontStyle:'orbitron',
  sponsorLogoUrl:'',
  mapImages:{},
  backgrounds: { standings: '', champion: '', teams: '', scoreboard: '' },
  teamLogos: {},
  playerPhotos: {},  // custom map images — overrides defaults
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
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
        <p className="font-mono text-[10px] text-gray-600">{value}</p>
      </div>
    </label>
  );
}


function BackgroundsSection({ design, upd }) {
  const [activeTab, setActiveTab] = useState("STANDINGS");
  const bg = design?.backgrounds || { standings: "", champion: "", teams: "", scoreboard: "" };

  const tabs = [
    { key: "standings", label: "FULL STANDINGS" },
    { key: "champion", label: "CHAMPION" },
    { key: "teams", label: "TEAMS TODAY" },
    { key: "scoreboard", label: "SCOREBOARD" },
  ];

  return (
    <div className="space-y-4">
      {/* Small tab-bar */}
      <div className="flex border-b border-white/5 pb-1 gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key.toUpperCase())}
            className={`px-3 py-1.5 text-[10px] font-orbitron font-bold tracking-wider rounded-lg transition-all ${
              activeTab === t.key.toUpperCase()
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabs.map(t => {
        if (activeTab !== t.key.toUpperCase()) return null;
        const url = bg[t.key] || "";
        return (
          <div key={t.key} className="space-y-3">
            <ImageUpload
              value={url}
              onChange={(newUrl) => upd("backgrounds", { ...bg, [t.key]: newUrl })}
              label={`${t.label} BACKGROUND`}
              name={`bg-${t.key}`}
              size="md"
            />
            <p className="text-[10px] text-gray-500 leading-normal">
              Replaces the default animated gradient background for this screen. Upload 1920×1080 PNG/JPG.
            </p>
            {url && (
              <button
                type="button"
                onClick={() => upd("backgrounds", { ...bg, [t.key]: "" })}
                className="rounded px-2.5 py-1 text-[9px] font-orbitron font-black bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all tracking-wider"
              >
                CLEAR
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImageManagementSection({ design, upd, teams = [], players = [] }) {
  return (
    <div className="space-y-6">
      {/* TOURNAMENT LOGO */}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <ImageUpload
          value={design?.logoUrl || ""}
          onChange={(url) => upd("logoUrl", url)}
          label="TOURNAMENT LOGO"
          name="tournament-logo"
          size="md"
        />
      </div>

      {/* TEAM LOGOS */}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3 border-b border-white/5 pb-1.5">
          TEAM LOGOS
        </p>
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {teams.length === 0 ? (
            <p className="text-[10px] text-gray-600 italic">No teams available. Note: Add teams prop to parent if missing.</p>
          ) : (
            teams.map(team => (
              <div key={team.id} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-white/2 hover:bg-white/5 transition-all">
                <span className="font-orbitron text-xs font-bold text-white max-w-[150px] truncate">{team.name}</span>
                <div className="w-[180px]">
                  <ImageUpload
                    value={(design?.teamLogos || {})[team.id] || ""}
                    onChange={(url) => upd("teamLogos", { ...(design?.teamLogos || {}), [team.id]: url })}
                    label=""
                    name={`team-logo-${team.id}`}
                    size="sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PLAYER PHOTOS */}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3 border-b border-white/5 pb-1.5">
          PLAYER PHOTOS
        </p>
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {players.length === 0 ? (
            <p className="text-[10px] text-gray-600 italic">No players available. Note: Add players prop to parent if missing.</p>
          ) : (
            players.map(player => {
              const team = teams.find(t => t.id === player.teamId || t.name === player.teamName || t.id === player.team_id);
              const teamBadge = team ? team.name : player.teamName || "NO TEAM";
              return (
                <div key={player.id} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-white/2 hover:bg-white/5 transition-all">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-orbitron text-xs font-bold text-white truncate">{player.name}</span>
                    <span className="inline-block self-start text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 uppercase font-orbitron">{teamBadge}</span>
                  </div>
                  <div className="w-[180px]">
                    <ImageUpload
                      value={(design?.playerPhotos || {})[player.id] || ""}
                      onChange={(url) => upd("playerPhotos", { ...(design?.playerPhotos || {}), [player.id]: url })}
                      label=""
                      name={`player-photo-${player.id}`}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Discord Webhook Section ─────────────────────────────────────── */
function DiscordSection({ tournament }) {
  const [webhookUrl,  setWebhookUrl]  = useState(tournament?.discord_webhook_url  || '');
  const [channelName, setChannelName] = useState(tournament?.discord_channel_name || '');
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [posting, setPosting] = useState('');

  // Sync from tournament prop changes
  React.useEffect(() => {
    setWebhookUrl(tournament?.discord_webhook_url || '');
    setChannelName(tournament?.discord_channel_name || '');
  }, [tournament?.id]);

  if (!tournament) return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-center">
      <p className="text-[11px] text-gray-500 font-orbitron">No active tournament. Create one first.</p>
    </div>
  );

  const save = async () => {
    setSaving(true);
    try {
      await overlayApi.saveDiscordWebhook({
        tournament_id: tournament.id,
        discord_webhook_url: webhookUrl.trim(),
        discord_channel_name: channelName.trim(),
      });
      toast.success('Webhook saved!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const test = async () => {
    setTesting(true);
    try {
      await overlayApi.saveDiscordWebhook({
        tournament_id: tournament.id,
        discord_webhook_url: webhookUrl.trim(),
        discord_channel_name: channelName.trim(),
      });
      await overlayApi.testDiscordWebhook({ tournament_id: tournament.id });
      toast.success('✅ Test message sent to Discord!');
    } catch (e) { toast.error(e.message); }
    setTesting(false);
  };

  const post = async (type, label) => {
    setPosting(type);
    try {
      await overlayApi.postDiscord({ tournament_id: tournament.id, type });
      toast.success(`📨 ${label} posted to Discord!`);
    } catch (e) { toast.error(e.message); }
    setPosting('');
  };

  const isConnected = !!tournament?.discord_webhook_url;

  const POST_BUTTONS = [
    { type: 'standings', label: 'LIVE STANDINGS',  icon: BarChart3, color: '#00D4FF' },
    { type: 'mvp',       label: 'MATCH MVP',        icon: Star,      color: '#FFD700' },
    { type: 'champion',  label: 'CHAMPIONS',        icon: Trophy,    color: '#FF6B00' },
    { type: 'teams',     label: 'TEAMS LINEUP',     icon: Users,     color: '#a855f7' },
  ];

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-3 ${
        isConnected
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-white/5 bg-black/20'
      }`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
        <div>
          <p className={`font-orbitron text-[10px] font-black tracking-wider ${isConnected ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isConnected ? 'WEBHOOK CONNECTED' : 'NOT CONFIGURED'}
          </p>
          {isConnected && tournament?.discord_channel_name && (
            <p className="text-[9px] text-gray-500 mt-0.5">#{tournament.discord_channel_name}</p>
          )}
        </div>
        {isConnected && (
          <button
            onClick={() => { setWebhookUrl(''); setChannelName(''); overlayApi.saveDiscordWebhook({ tournament_id: tournament.id, discord_webhook_url: '', discord_channel_name: '' }).catch(()=>{}); }}
            className="ml-auto text-gray-600 hover:text-red-400 transition-colors"
            title="Remove webhook"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Webhook config */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-gray-500">
            <Link className="inline w-3 h-3 mr-1" />
            DISCORD WEBHOOK URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-[11px] font-mono text-white placeholder-gray-600 outline-none focus:border-[#5865F2]/50 transition-colors"
          />
          <p className="mt-1 text-[9px] text-gray-600">In Discord: Channel Settings → Integrations → Webhooks → New Webhook → Copy URL</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-gray-500">CHANNEL NAME (optional label)</label>
          <input
            type="text"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            placeholder="e.g. #tournament-updates"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#5865F2]/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-orbitron font-black tracking-wider text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5865F2, #7289da)' }}
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
          <button
            onClick={test} disabled={testing || !webhookUrl.trim()}
            className="flex items-center justify-center gap-2 px-4 rounded-xl border border-white/10 text-[11px] font-orbitron font-black tracking-wider text-gray-300 hover:border-white/20 hover:text-white transition-all disabled:opacity-40"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TestTube2 className="w-3.5 h-3.5" />}
            TEST
          </button>
        </div>
      </div>

      {/* Post buttons */}
      {isConnected && (
        <div className="space-y-2">
          <p className="text-[9px] font-orbitron font-black tracking-widest text-gray-500 uppercase">POST TO DISCORD NOW</p>
          <div className="grid grid-cols-2 gap-2">
            {POST_BUTTONS.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => post(type, label)}
                disabled={!!posting}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-3 font-orbitron text-[10px] font-black tracking-wider transition-all hover:bg-white/5 disabled:opacity-40"
                style={{ color: posting === type ? '#fff' : color, borderColor: posting === type ? color + '44' : undefined }}
              >
                {posting === type
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                {posting === type ? 'POSTING...' : label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 text-center">Posts a rich embed to your Discord channel instantly</p>
        </div>
      )}

      {/* How to get webhook URL guide */}
      {!isConnected && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
          <p className="font-orbitron text-[10px] font-black text-gray-400 tracking-wider">HOW TO GET A WEBHOOK URL</p>
          {[
            '1. Open your Discord server',
            '2. Right-click the channel → Edit Channel',
            '3. Go to Integrations → Webhooks',
            '4. Click "New Webhook" → Copy Webhook URL',
            '5. Paste it above and click Save',
          ].map((step, i) => (
            <p key={i} className="text-[10px] text-gray-500">{step}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesignStudio(props) {
  const { onAction, teams = [], players = [], tournament = null } = props;
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
    const c = [...(design?.casters || [{},{},{}])];
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

  const savePins = async () => {
    const current = await getPins();
    const next = { ...current };
    if (pins.director?.length === 4) next.director = pins.director;
    if (pins.inputer?.length === 4)  next.inputer  = pins.inputer;
    await setPins(next);
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
          <ColorPicker label="Primary Accent" value={design?.accentColor} onChange={v => upd('accentColor', v)} />
          <ColorPicker label="Secondary Accent" value={design?.accentColor2} onChange={v => upd('accentColor2', v)} />
          <ColorPicker label="Background" value={design?.bgColor} onChange={v => upd('bgColor', v)} />
          <ColorPicker label="Text" value={design?.textColor} onChange={v => upd('textColor', v)} />
        </div>
      </Section>

      {/* ── FONT ── */}
      <Section title="FONT STYLE" icon={Type}>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map(f => (
            <button key={f.key} onClick={() => upd('fontStyle', f.key)}
              className={`rounded-xl py-3 text-center transition-all border ${design?.fontStyle === f.key ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              <p className="text-base font-black" style={{ fontFamily: f.key === 'impact' ? 'Impact' : f.key === 'rajdhani' ? 'Rajdhani' : 'Orbitron' }}>ESPORT</p>
              <p className="mt-0.5 text-[9px] opacity-70">{f.label}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── OVERLAY STYLE ── */}
      <Section title="OVERLAY LAYOUT THEME" icon={Layers}>
        <p className="mb-3 text-[10px] text-gray-500 leading-relaxed">
          Choose a visual layout for all overlays. Same data & structure — completely different look.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {OVERLAY_STYLES.map(s => {
            const isActive = (design?.overlayStyle || 'default') === s.key;
            return (
              <button key={s.key} onClick={() => upd('overlayStyle', s.key)}
                className="w-full text-left transition-all"
                style={{
                  border: isActive ? `1px solid ${s.preview.p}88` : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  background: isActive ? `${s.preview.p}10` : 'rgba(255,255,255,0.02)',
                  padding: '12px 14px',
                }}>
                <div className="flex items-center gap-3">
                  {/* Mini preview panel */}
                  <div style={{
                    width: 52, height: 36, borderRadius: 6, flexShrink: 0, position: 'relative', overflow: 'hidden',
                    background: '#060912',
                    border: `1px solid ${s.preview.p}44`,
                  }}>
                    {/* Corner decorations per style */}
                    {s.preview.corner === 'dual' && <>
                      <div style={{ position:'absolute', top:0, left:0, width:7, height:7, borderTop:`2px solid ${s.preview.p}`, borderLeft:`2px solid ${s.preview.p}` }} />
                      <div style={{ position:'absolute', top:0, right:0, width:7, height:7, borderTop:`2px solid ${s.preview.s}`, borderRight:`2px solid ${s.preview.s}` }} />
                      <div style={{ position:'absolute', bottom:0, left:0, width:7, height:7, borderBottom:`2px solid ${s.preview.s}`, borderLeft:`2px solid ${s.preview.s}` }} />
                      <div style={{ position:'absolute', bottom:0, right:0, width:7, height:7, borderBottom:`2px solid ${s.preview.p}`, borderRight:`2px solid ${s.preview.p}` }} />
                    </>}
                    {s.preview.corner === 'glow' && <>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.preview.p},${s.preview.s},transparent)` }} />
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${s.preview.p}66,transparent)` }} />
                    </>}
                    {s.preview.corner === 'tick' && <>
                      <div style={{ position:'absolute', top:0, left:0, width:10, height:2, background:s.preview.p }} />
                      <div style={{ position:'absolute', top:0, left:0, width:2, height:10, background:s.preview.p }} />
                      <div style={{ position:'absolute', bottom:0, right:0, width:10, height:2, background:s.preview.s }} />
                      <div style={{ position:'absolute', bottom:0, right:0, width:2, height:10, background:s.preview.s }} />
                    </>}
                    {s.preview.corner === 'none' && <>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'rgba(255,255,255,0.15)' }} />
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'rgba(255,255,255,0.08)' }} />
                    </>}
                    {s.preview.corner === 'rect' && <>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.preview.p }} />
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:s.preview.s }} />
                    </>}
                    {/* Mini fake rows */}
                    <div style={{ position:'absolute', top:6, left:6, right:6, height:3, background:`${s.preview.p}55`, borderRadius:1 }} />
                    <div style={{ position:'absolute', top:13, left:6, right:10, height:2, background:'rgba(255,255,255,0.12)', borderRadius:1 }} />
                    <div style={{ position:'absolute', top:18, left:6, right:14, height:2, background:'rgba(255,255,255,0.08)', borderRadius:1 }} />
                    <div style={{ position:'absolute', top:23, left:6, right:10, height:2, background:'rgba(255,255,255,0.06)', borderRadius:1 }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-[10px] font-black" style={{ color: isActive ? s.preview.p : '#fff' }}>{s.label}</span>
                      {isActive && <Check size={10} style={{ color: s.preview.p, flexShrink: 0 }} />}
                    </div>
                    <p className="mt-0.5 text-[9px] text-gray-500 leading-tight">{s.desc}</p>
                  </div>

                  {/* Color swatches */}
                  <div className="flex gap-1 flex-shrink-0">
                    <div style={{ width:12, height:20, borderRadius:2, background:s.preview.p }} />
                    <div style={{ width:12, height:20, borderRadius:2, background:s.preview.s }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[9px] text-gray-600 leading-relaxed">
          ℹ️ Custom Colours below override accent colors for the Default theme only.
        </p>
      </Section>

      {/* ── MAP IMAGES ── */}
      <Section title="MAP IMAGES" icon={Map}>
        <p className="mb-3 text-[10px] text-gray-500">Upload custom map images to replace the defaults. These appear in the pre-match map overlay and scoreboard screens.</p>
        <div className="grid grid-cols-2 gap-3">
          {MAPS.map(mapName => (
            <div key={mapName} className="rounded-xl border border-white/8 bg-black/20 p-3">
              <p className="font-orbitron text-[9px] font-black text-gray-400 mb-2 tracking-wider">{mapName.toUpperCase()}</p>
              <ImageUpload
                value={(design?.mapImages || {})[mapName] || ''}
                onChange={(url) => upd('mapImages', { ...(design?.mapImages || {}), [mapName]: url })}
                label=""
                name={`map-${mapName.toLowerCase().replace(/\s+/g,'-')}`}
                size="sm"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => upd('mapImages', {})}
          className="mt-3 w-full rounded-lg border border-white/10 py-2 text-[10px] font-orbitron text-gray-500 hover:text-white hover:border-white/20 transition-all"
        >
          Reset All Map Images to Defaults
        </button>
      </Section>

      
      {/* ── BACKGROUNDS ── */}
      <Section title="BACKGROUNDS" icon={Image}>
        <BackgroundsSection design={design} upd={upd} />
      </Section>

      {/* ── IMAGE MANAGEMENT ── */}
      <Section title="IMAGE MANAGEMENT" icon={FolderOpen}>
        <ImageManagementSection design={design} upd={upd} teams={teams} players={players} />
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
              <input value={design?.[key] || ''} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/40 transition-colors" />
            </div>
          ))}

          <ImageUpload
            value={design?.logoUrl || ''}
            onChange={(url) => upd('logoUrl', url)}
            label="Tournament Logo (shows in scoreboard header & overlay screens)"
            name="tournament-logo"
          />
          <ImageUpload
            value={design?.sponsorLogoUrl || ''}
            onChange={(url) => upd('sponsorLogoUrl', url)}
            label="Sponsor Logo (shows in casters screen)"
            name="sponsor-logo"
          />
        </div>
      </Section>


      {/* ── POINT RUSH STANDINGS ── */}
      <Section title="POINT RUSH GFX" icon={Trophy}>
        <div className="space-y-4">
          <p className="text-[10px] text-gray-500 leading-normal">
            Customize the Point Rush Standings overlay screen. All changes push live to OBS instantly.
          </p>

          {/* Header text */}
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">Header Title</label>
            <input value={design?.pointRush?.headerText || ''} onChange={e => upd("pointRush", { ...design?.pointRush, headerText: e.target.value })}
              placeholder="POINT RUSH STANDINGS"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/40 transition-colors" />
          </div>

          {/* Footer text */}
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">Footer Text</label>
            <input value={design?.pointRush?.footerText || ''} onChange={e => upd("pointRush", { ...design?.pointRush, footerText: e.target.value })}
              placeholder="#Rise to THE SUMMIT"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/40 transition-colors" />
          </div>

          {/* Gradient colors */}
          <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
            <p className="text-[9px] font-orbitron font-black tracking-widest text-gray-400 uppercase border-b border-white/5 pb-1.5">Background Gradient</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">Start</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={design?.pointRush?.gradientStart || '#1e3a8a'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientStart: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                  <input value={design?.pointRush?.gradientStart || '#1e3a8a'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientStart: e.target.value })}
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-orange-500/30" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">Mid</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={design?.pointRush?.gradientMid || '#7c3aed'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientMid: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                  <input value={design?.pointRush?.gradientMid || '#7c3aed'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientMid: e.target.value })}
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-orange-500/30" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-600">End</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={design?.pointRush?.gradientEnd || '#ec4899'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientEnd: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                  <input value={design?.pointRush?.gradientEnd || '#ec4899'} onChange={e => upd("pointRush", { ...design?.pointRush, gradientEnd: e.target.value })}
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-orange-500/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Hazard tape toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 p-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-gray-600">Hazard Tape Corners</label>
              <p className="text-[9px] text-gray-600 mt-0.5">Yellow/black diagonal stripes in screen corners</p>
            </div>
            <button
              type="button"
              onClick={() => upd("pointRush", { ...design?.pointRush, hazardTape: !(design?.pointRush?.hazardTape !== false) })}
              className={`relative w-12 h-6 rounded-full transition-colors ${(design?.pointRush?.hazardTape !== false) ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(design?.pointRush?.hazardTape !== false) ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => {
              upd("pointRush", { gradientStart: '#1e3a8a', gradientMid: '#7c3aed', gradientEnd: '#ec4899', footerText: '#Rise to THE SUMMIT', headerText: 'POINT RUSH STANDINGS', hazardTape: true });
              toast.success('Point Rush GFX reset to defaults');
            }}
            className="rounded-lg px-3 py-2 text-[10px] font-orbitron font-black bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all tracking-wider">
            RESET TO DEFAULTS
          </button>
        </div>
      </Section>

      {/* ── CASTERS ── */}
      <Section title="CASTERS" icon={Mic2}>
        <div className="space-y-3">
          {(design?.casters || [{},{},{}]).slice(0,3).map((c, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Caster {i + 1}</p>
              <div className="grid grid-cols-3 gap-2">
                <input value={c?.name || ''} onChange={e => updCaster(i, 'name', e.target.value)}
                  placeholder={`Name ${i+1}`}
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
                <input value={c?.handle || ''} onChange={e => updCaster(i, 'handle', e.target.value)}
                  placeholder="@handle"
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
                <input value={c?.role || ''} onChange={e => updCaster(i, 'role', e.target.value)}
                  placeholder="PLAY-BY-PLAY"
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
              </div>
              <ImageUpload
                value={c?.photo || ''}
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

      {/* ── DISCORD WEBHOOKS ── */}
      <Section title="DISCORD WEBHOOKS" icon={BotMessageSquare}>
        <DiscordSection tournament={tournament} />
      </Section>

      {/* ── LIVE PREVIEW ── */}
      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: (design?.accentColor || '#f97316') + '55' }}>
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: `linear-gradient(135deg, ${(design?.accentColor || '#f97316')}22, ${design?.bgColor || '#060915'}, ${(design?.accentColor2 || '#00d4ff')}22)`, borderBottom: `1px solid ${(design?.accentColor || '#f97316')}33` }}>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full" style={{ background: (design?.accentColor || '#f97316') + '44' }}>
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-[8px]" style={{ color: design?.accentColor }}>G</span>
              </div>
            </div>
            <span className="font-orbitron text-[9px] font-black" style={{ color: design?.accentColor }}>GARENA</span>
          </div>
          <span className="font-orbitron text-[10px] font-black" style={{ color: design?.textColor, fontFamily: design?.fontStyle === 'impact' ? 'Impact' : design?.fontStyle === 'rajdhani' ? 'Rajdhani' : 'Orbitron' }}>
            {design?.tournamentName || 'FF OFFICIAL'}
          </span>
          <span className="font-orbitron text-[9px] font-black" style={{ color: design?.accentColor2 }}>
            {design?.tournamentName || 'FF OFFICIAL'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: design?.bgColor || '#060915' }}>
          <div style={{ color: (design?.textColor || '#ffffff') + '88', fontSize: 10 }}>RANK · LOGO · TEAM NAME · KILLS · BOOYAH · TOTAL POINTS</div>
          <div className="flex gap-0.5">
            {[1,1,1,0].map((a,i) => <div key={i} className="rounded-sm" style={{ width:4, height:a?12:6, background:a?(design?.accentColor || '#f97316'):(design?.accentColor || '#f97316')+'33', marginTop:a?0:3 }} />)}
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
          style={{ background: saving ? (design?.accentColor || '#f97316') + 'aa' : (design?.accentColor || '#f97316') }}>
          {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Apply Design to Overlay</>}
        </button>
      </div>
    </div>
  );
}
