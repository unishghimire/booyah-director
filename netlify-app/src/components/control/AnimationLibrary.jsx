import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Eye, EyeOff, Save, RefreshCw, Play,
  Film, Wand2, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const ANIMATIONS = [
  { key: 'slide-right', label: 'Slide Right', css: 'nx-slide-right', icon: '→', category: 'Slide' },
  { key: 'slide-left',  label: 'Slide Left',  css: 'nx-slide-left',  icon: '←', category: 'Slide' },
  { key: 'slide-up',   label: 'Slide Up',    css: 'nx-slide-up',    icon: '↑', category: 'Slide' },
  { key: 'slide-down', label: 'Slide Down',  css: 'nx-slide-down',  icon: '↓', category: 'Slide' },
  { key: 'fade-in',    label: 'Fade In',     css: 'nx-fade-in',     icon: '◐', category: 'Fade' },
  { key: 'blur-in',    label: 'Blur In',     css: 'nx-blur-in',     icon: '◍', category: 'Fade' },
  { key: 'scale-in',   label: 'Scale In',    css: 'nx-scale-in',    icon: '▣', category: 'Scale' },
  { key: 'zoom-in',    label: 'Zoom In',     css: 'nx-zoom-in',     icon: '⊕', category: 'Scale' },
  { key: 'zoom-out',   label: 'Zoom Out',    css: 'nx-zoom-out',    icon: '⊖', category: 'Scale' },
  { key: 'pop-in',     label: 'Pop In',      css: 'nx-pop-in',      icon: '✦', category: 'Scale' },
  { key: 'flip-x',     label: 'Flip X',      css: 'nx-flip-x',      icon: '⤿', category: 'Flip' },
  { key: 'flip-y',     label: 'Flip Y',      css: 'nx-flip-y',      icon: '⤺', category: 'Flip' },
  { key: 'glow',       label: 'Glow Pulse',  css: 'nx-glow-text',   icon: '✧', category: 'Glow' },
  { key: 'pulse',      label: 'Pulse',       css: 'nx-pulse',       icon: '◉', category: 'Glow' },
  { key: 'explosion',  label: 'Explosion',   css: 'nx-explosion',   icon: '💥', category: 'Impact' },
  { key: 'bounce-in',  label: 'Bounce In',   css: 'nx-bounce-in',   icon: '⤴', category: 'Impact' },
  { key: 'camera-shake', label: 'Camera Shake', css: 'nx-camera-shake', icon: '📳', category: 'Impact' },
  { key: 'flash',      label: 'Flash',       css: 'nx-flash',       icon: '⚡', category: 'Impact' },
  { key: 'glitch',     label: 'Glitch',      css: 'nx-glitch',      icon: '⚠', category: 'Impact' },
];

const CATEGORIES = ['Slide', 'Fade', 'Scale', 'Flip', 'Glow', 'Impact'];

// Event types that can have custom animations
const EVENT_TYPES = [
  { key: 'first_blood',  label: 'First Blood' },
  { key: 'team_wipe',    label: 'Team Wipe' },
  { key: 'winner',       label: 'Winner' },
  { key: 'mvp',          label: 'MVP' },
  { key: 'match_point',  label: 'Match Point' },
  { key: 'final_circle', label: 'Final Circle' },
  { key: 'safe_zone',    label: 'Safe Zone' },
  { key: 'default',      label: 'Default (all other events)' },
];

export default function AnimationLibrary({ data, overlayApi, refresh }) {
  const [config, setConfig] = useState({
    defaultEntrance: 'slide-right',
    defaultExit: 'fade-in',
    speed: 1.0,
    eventOverrides: {},
  });
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewing, setPreviewing] = useState(null);
  const previewRef = useRef(null);

  // Load config from Firebase
  useEffect(() => {
    if (data?.design?.animationConfig) {
      setConfig({
        defaultEntrance: data.design.animationConfig.defaultEntrance || 'slide-right',
        defaultExit: data.design.animationConfig.defaultExit || 'fade-in',
        speed: data.design.animationConfig.speed ?? 1.0,
        eventOverrides: data.design.animationConfig.eventOverrides || {},
      });
    }
  }, [data?.design?.animationConfig]);

  const triggerPreview = (animKey) => {
    const anim = ANIMATIONS.find(a => a.key === animKey);
    if (!anim) return;
    
    setPreviewing(animKey);
    if (previewRef.current) {
      previewRef.current.classList.remove(anim.css);
      // Force reflow
      void previewRef.current.offsetWidth;
      previewRef.current.classList.add(anim.css);
    }
    setTimeout(() => setPreviewing(null), 1500);
  };

  const setEventAnim = (eventKey, animKey) => {
    setConfig(prev => ({
      ...prev,
      eventOverrides: {
        ...prev.eventOverrides,
        [eventKey]: animKey,
      }
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      if (overlayApi?.saveDesign) {
        await overlayApi.saveDesign({ animationConfig: config });
        toast.success('Animation configuration saved!');
        if (refresh) refresh();
      } else {
        toast.error('Save not available');
      }
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig({
      defaultEntrance: 'slide-right',
      defaultExit: 'fade-in',
      speed: 1.0,
      eventOverrides: {},
    });
    toast.info('Reset to defaults (remember to save)');
  };

  const filteredAnims = activeCategory === 'all' 
    ? ANIMATIONS 
    : ANIMATIONS.filter(a => a.category === activeCategory);

  const getAnimByKey = (key) => ANIMATIONS.find(a => a.key === key);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">ANIMATION LIBRARY</h2>
            <p className="text-xs text-slate-400">Configure entrance, exit, and event animations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetConfig}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SAVE CONFIG
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
        <div
          ref={previewRef}
          className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40"
          style={{ animationDuration: `${config.speed}s` }}
        >
          <span className="text-2xl font-bold text-white tracking-wide">
            {previewing ? getAnimByKey(previewing)?.label || 'Preview' : 'PREVIEW'}
          </span>
        </div>
      </div>

      {/* Default Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" /> Default Entrance Animation
          </label>
          <select
            value={config.defaultEntrance}
            onChange={(e) => {
              setConfig(prev => ({ ...prev, defaultEntrance: e.target.value }));
              triggerPreview(e.target.value);
            }}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
          >
            {ANIMATIONS.map(a => (
              <option key={a.key} value={a.key}>{a.label} — {a.category}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-amber-400" /> Default Exit Animation
          </label>
          <select
            value={config.defaultExit}
            onChange={(e) => {
              setConfig(prev => ({ ...prev, defaultExit: e.target.value }));
              triggerPreview(e.target.value);
            }}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
          >
            {ANIMATIONS.filter(a => !a.css.includes('infinite')).map(a => (
              <option key={a.key} value={a.key}>{a.label} — {a.category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Speed Control */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Animation Speed
          </label>
          <span className="text-xs text-slate-400 font-mono">{config.speed.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={config.speed}
          onChange={(e) => setConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>Fast (0.2s)</span>
          <span>Normal (1.0s)</span>
          <span>Slow (2.0s)</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          ALL
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Animation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAnims.map(anim => {
          const isSelected = config.defaultEntrance === anim.key;
          const isEventOverride = Object.values(config.eventOverrides || {}).includes(anim.key);
          
          return (
            <div
              key={anim.key}
              className={`relative bg-slate-900/60 border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-500/40 ${
                isSelected ? 'border-purple-500/60 shadow-[0_0_12px_rgba(124,58,237,0.2)]' : 'border-slate-800'
              }`}
              onClick={() => triggerPreview(anim.key)}
            >
              {/* Icon */}
              <div className="text-2xl mb-2 text-purple-400">{anim.icon}</div>
              {/* Label */}
              <div className="text-xs font-medium text-white mb-1">{anim.label}</div>
              <div className="text-[10px] text-slate-500 mb-2">{anim.category}</div>
              
              {/* Status badges */}
              {isSelected && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                  ENTRANCE
                </div>
              )}
              {config.defaultExit === anim.key && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold mt-0">
                  EXIT
                </div>
              )}
              
              {/* Play button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPreview(anim.key);
                }}
                className="mt-1 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" /> PREVIEW
              </button>
            </div>
          );
        })}
      </div>

      {/* Event Animation Overrides */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Event Animation Overrides</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Assign specific animations to individual event types. Unassigned events use the default entrance animation.</p>
        
        <div className="space-y-3">
          {EVENT_TYPES.map(event => (
            <div key={event.key} className="flex items-center gap-3">
              <div className="w-48 text-sm text-slate-300">{event.label}</div>
              <select
                value={config.eventOverrides?.[event.key] || ''}
                onChange={(e) => setEventAnim(event.key, e.target.value)}
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none"
              >
                <option value="">Default ({getAnimByKey(config.defaultEntrance)?.label || 'None'})</option>
                {ANIMATIONS.map(a => (
                  <option key={a.key} value={a.key}>{a.label} — {a.category}</option>
                ))}
              </select>
              {config.eventOverrides?.[event.key] && (
                <button
                  onClick={() => setEventAnim(event.key, '')}
                  className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <div className="text-blue-400 text-sm">ℹ️</div>
        <div className="text-xs text-slate-400 leading-relaxed">
          <p className="mb-1"><strong className="text-slate-300">How it works:</strong></p>
          <p>• Set the default entrance/exit animations for all overlay elements</p>
          <p>• Override specific event types with custom animations for extra impact</p>
          <p>• Click any animation card to see a live preview</p>
          <p>• Animation speed controls the duration — faster for snappy broadcasts, slower for dramatic effects</p>
          <p>• Config saves to Firebase and syncs to all overlay browser sources automatically</p>
        </div>
      </div>
    </div>
  );
}
