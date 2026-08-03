import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Trash2,
  Save, RefreshCw, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Event types matching LiveControlPanel event buttons
const SOUND_EVENTS = [
  { key: 'first_blood',  label: 'First Blood',  icon: '🩸', color: '#ef4444' },
  { key: 'double_kill',  label: 'Double Kill',  icon: '⚔️', color: '#f59e0b' },
  { key: 'triple_kill',  label: 'Triple Kill',  icon: '⚔️', color: '#8b5cf6' },
  { key: 'quadra_kill',  label: 'Quadra Kill',  icon: '⚔️', color: '#3B82F6' },
  { key: 'penta_kill',   label: 'Penta Kill',   icon: '🏆', color: '#7C3AED' },
  { key: 'team_wipe',    label: 'Team Wipe',    icon: '💀', color: '#ec4899' },
  { key: 'airdrop',      label: 'Airdrop',      icon: '📦', color: '#22c55e' },
  { key: 'final_circle', label: 'Final Circle',  icon: '🔴', color: '#ef4444' },
  { key: 'safe_zone',    label: 'Safe Zone',    icon: '🌀', color: '#06b6d4' },
  { key: 'match_point',  label: 'Match Point',  icon: '🎯', color: '#f97316' },
  { key: 'winner',       label: 'Winner',       icon: '👑', color: '#fbbf24' },
  { key: 'mvp',          label: 'MVP',          icon: '⭐', color: '#eab308' },
  { key: 'game_start',   label: 'Game Start',   icon: '🎮', color: '#10b981' },
  { key: 'match_end',    label: 'Match End',    icon: '🏁', color: '#6b7280' },
];

export default function SoundManager({ data, overlayApi, refresh }) {
  const [soundConfig, setSoundConfig] = useState({});
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef(null);

  // Load sound config from design data
  useEffect(() => {
    if (data?.design?.soundConfig) {
      setSoundConfig(data.design.soundConfig);
      setMasterVolume(data.design.soundConfig._masterVolume ?? 0.7);
      setMuted(data.design.soundConfig._muted ?? false);
    }
  }, [data?.design?.soundConfig]);

  const updateEventSound = (eventKey, field, value) => {
    setSoundConfig(prev => ({
      ...prev,
      [eventKey]: {
        url: field === 'url' ? value : (prev[eventKey]?.url || ''),
        volume: field === 'volume' ? parseFloat(value) : (prev[eventKey]?.volume ?? 0.8),
        enabled: field === 'enabled' ? value : (prev[eventKey]?.enabled ?? true),
      }
    }));
  };

  const removeEventSound = (eventKey) => {
    setSoundConfig(prev => {
      const next = { ...prev };
      delete next[eventKey];
      return next;
    });
    toast.success(`Sound removed for ${eventKey}`);
  };

  const previewSound = (eventKey) => {
    const config = soundConfig[eventKey];
    if (!config?.url) {
      toast.error('No audio URL set for this event');
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(config.url);
    audio.volume = muted ? 0 : Math.min(config.volume ?? 0.8, 1) * masterVolume;
    audio.play().then(() => {
      setPlaying(eventKey);
      audio.onended = () => setPlaying(null);
    }).catch(() => {
      toast.error('Failed to play audio. Check the URL.');
      setPlaying(null);
    });
    audioRef.current = audio;
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(null);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configToSave = {
        ...soundConfig,
        _masterVolume: masterVolume,
        _muted: muted,
      };
      if (overlayApi?.saveDesign) {
        await overlayApi.saveDesign({ soundConfig: configToSave });
        toast.success('Sound configuration saved!');
        if (refresh) refresh();
      } else {
        toast.error('Save not available — API not connected');
      }
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.keys(soundConfig).filter(k => !k.startsWith('_') && soundConfig[k]?.url).length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">SOUND MANAGER</h2>
            <p className="text-xs text-slate-400">{assignedCount}/{SOUND_EVENTS.length} events configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors active:scale-[0.98] ${
              muted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SAVE CONFIG
          </button>
        </div>
      </div>

      {/* Master Volume */}
      <div className="nx-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300">Master Volume</label>
          <span className="text-xs text-slate-400 font-mono">{Math.round(masterVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Event Sound Assignments */}
      <div className="space-y-3">
        {SOUND_EVENTS.map(event => {
          const config = soundConfig[event.key];
          const hasSound = config?.url;
          const isPlaying = playing === event.key;

          return (
            <div
              key={event.key}
              className={`nx-surface p-4 transition-colors ${
                hasSound ? 'border-purple-500/30' : 'border-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${event.color}20` }}
                >
                  {event.icon}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">{event.label}</span>
                  {hasSound && (
                    <span className="ml-2 text-xs text-emerald-400 flex items-center gap-1 inline-flex">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>
                {/* Preview / Stop */}
                {isPlaying ? (
                  <button
                    onClick={stopPreview}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs flex items-center gap-1 active:scale-[0.98]"
                  >
                    <Pause className="w-3 h-3" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={() => previewSound(event.key)}
                    disabled={!hasSound}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <Play className="w-3 h-3" /> Test
                  </button>
                )}
                {/* Enable/Disable */}
                <button
                  onClick={() => updateEventSound(event.key, 'enabled', !config?.enabled)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium active:scale-[0.98] ${
                    config?.enabled === false
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {config?.enabled === false ? 'OFF' : 'ON'}
                </button>
              </div>

              {/* URL Input + Volume */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://cdn.example.com/sound.mp3"
                  value={config?.url || ''}
                  onChange={(e) => updateEventSound(event.key, 'url', e.target.value)}
                  className="flex-1 nx-input px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config?.volume ?? 0.8}
                    onChange={(e) => updateEventSound(event.key, 'volume', e.target.value)}
                    className="w-20 accent-purple-500"
                  />
                  <span className="text-xs text-slate-500 font-mono w-8">
                    {Math.round((config?.volume ?? 0.8) * 100)}
                  </span>
                </div>
                {hasSound && (
                  <button
                    onClick={() => removeEventSound(event.key)}
                    className="px-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <div className="text-blue-400 text-sm">ℹ️</div>
        <div className="text-xs text-slate-400 leading-relaxed">
          <p className="mb-1"><strong className="text-slate-300">How it works:</strong></p>
          <p>• Paste a direct audio URL (MP3, WAV, OGG) for each event</p>
          <p>• Click <strong className="text-slate-300">Test</strong> to preview the sound at the set volume</p>
          <p>• When you trigger events from the <strong className="text-slate-300">Live Control Panel</strong>, the assigned sound plays automatically</p>
          <p>• Master volume controls all sounds globally; mute silences everything</p>
          <p>• Configuration is saved to Firebase and syncs across all connected devices</p>
        </div>
      </div>
    </div>
  );
}
