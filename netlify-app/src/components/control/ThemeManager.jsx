import React, { useState, useEffect } from 'react';
import { SectionBoundary } from '@/components/ErrorBoundary';
import {
  Palette, Check, ChevronDown, ChevronUp, Sliders, Sparkles,
  Trophy, Swords, Monitor, Paintbrush, Plus, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

export const THEMES = [
  { id: 'nexplay', name: 'NEXPLAY PURPLE', primary: '#7C3AED', secondary: '#3B82F6', bg: '#04060E', card: '#131127', accent: '#22c55e' },
  { id: 'orange', name: 'OFFICIAL ORANGE', primary: '#FF6A1A', secondary: '#FF4E00', bg: '#0A0A0A', card: '#1A1A1A', accent: '#FFAA00' },
  { id: 'neon-blue', name: 'NEON BLUE', primary: '#00E5FF', secondary: '#0288D1', bg: '#001220', card: '#001830', accent: '#22c55e' },
  { id: 'dark-red', name: 'DARK RED', primary: '#DC2626', secondary: '#991B1B', bg: '#0A0000', card: '#1A0A0A', accent: '#F59E0B' },
  { id: 'gold', name: 'GOLD ELITE', primary: '#FBBF24', secondary: '#D97706', bg: '#0A0900', card: '#1A1500', accent: '#22c55e' },
  { id: 'world-finals', name: 'WORLD FINALS', primary: '#C026D3', secondary: '#7C3AED', bg: '#0A0014', card: '#15001F', accent: '#FBBF24' },
  { id: 'minimal', name: 'MINIMAL WHITE', primary: '#FFFFFF', secondary: '#E5E7EB', bg: '#0A0A0A', card: '#1A1A1A', accent: '#22c55e' },
  { id: 'dark-mode', name: 'DARK MODE', primary: '#6B7280', secondary: '#4B5563', bg: '#000000', card: '#111111', accent: '#9CA3AF' },
];

export default function ThemeManager({ currentTheme, onApplyTheme, tournament }) {
  // Determine if a theme matches currentTheme
  const isActiveTheme = (theme) => {
    if (!currentTheme) return false;
    if (typeof currentTheme === 'string') {
      return theme.id === currentTheme;
    }
    if (typeof currentTheme === 'object') {
      return theme.id === currentTheme.id || (
        theme.primary === currentTheme.primary &&
        theme.secondary === currentTheme.secondary &&
        theme.bg === currentTheme.bg &&
        theme.card === currentTheme.card &&
        theme.accent === currentTheme.accent
      );
    }
    return false;
  };

  // State to manage selection and previewing
  const [selectedTheme, setSelectedTheme] = useState(() => {
    if (!currentTheme) return THEMES[0];
    if (typeof currentTheme === 'string') {
      return THEMES.find(t => t.id === currentTheme) || THEMES[0];
    }
    if (typeof currentTheme === 'object') {
      return currentTheme;
    }
    return THEMES[0];
  });

  const [hoveredTheme, setHoveredTheme] = useState(null);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Custom Theme Builder state
  const [customTheme, setCustomTheme] = useState({
    id: 'custom',
    name: 'CUSTOM OPERATOR',
    primary: '#7C3AED',
    secondary: '#3B82F6',
    bg: '#04060E',
    card: '#131127',
    accent: '#22c55e',
  });

  // Sync selectedTheme when currentTheme changes from props
  useEffect(() => {
    if (currentTheme) {
      let resolved = null;
      if (typeof currentTheme === 'string') {
        resolved = THEMES.find(t => t.id === currentTheme);
      } else if (typeof currentTheme === 'object') {
        resolved = currentTheme;
      }
      if (resolved) {
        setSelectedTheme(resolved);
        const isPreset = THEMES.some(t => t.id === resolved.id);
        if (!isPreset) {
          setCustomTheme({
            id: 'custom',
            name: resolved.name || 'CUSTOM THEME',
            primary: resolved.primary || '#7C3AED',
            secondary: resolved.secondary || '#3B82F6',
            bg: resolved.bg || '#04060E',
            card: resolved.card || '#131127',
            accent: resolved.accent || '#22c55e'
          });
        }
      }
    }
  }, [currentTheme]);

  // Live theme active in preview panel
  const activePreviewTheme = hoveredTheme || selectedTheme;

  // Handles updating individual color/name fields in Custom Theme
  const handleCustomFieldChange = (key, value) => {
    const updated = {
      ...customTheme,
      [key]: value
    };
    setCustomTheme(updated);
    setSelectedTheme(updated); // Live preview the custom updates
  };

  // Quick action to clone selected preset to custom builder
  const handleLoadSelectedAsBase = () => {
    const baseTheme = hoveredTheme || selectedTheme;
    setCustomTheme({
      id: 'custom',
      name: baseTheme.id.startsWith('custom') ? baseTheme.name : `${baseTheme.name} CUSTOM`,
      primary: baseTheme.primary,
      secondary: baseTheme.secondary,
      bg: baseTheme.bg,
      card: baseTheme.card,
      accent: baseTheme.accent,
    });
    toast.success('Loaded preset colors into custom builder!', {
      icon: '📥',
      style: { background: '#131127', color: '#fff', border: '1px solid #7C3AED' }
    });
  };

  // Handles applying the selected preset or standard theme
  const handleApplySelected = () => {
    if (onApplyTheme) {
      onApplyTheme(selectedTheme);
      toast.success(`Theme Applied: ${selectedTheme.name}`, {
        icon: '🎨',
        style: { background: '#131127', color: '#fff', border: '1px solid #7C3AED' }
      });
    }
  };

  // Handles saving and applying custom theme
  const handleApplyCustom = (e) => {
    e.preventDefault();
    const customThemeObject = {
      id: `custom-${Date.now()}`,
      name: customTheme.name.toUpperCase().trim() || 'CUSTOM THEME',
      primary: customTheme.primary,
      secondary: customTheme.secondary,
      bg: customTheme.bg,
      card: customTheme.card,
      accent: customTheme.accent,
    };
    if (onApplyTheme) {
      onApplyTheme(customThemeObject);
      toast.success(`Custom Theme Applied: ${customThemeObject.name}`, {
        icon: '⚙️',
        style: { background: '#131127', color: '#fff', border: '1px solid #7C3AED' }
      });
    }
  };

  return (
    <SectionBoundary label="THEME MANAGER">
      <div className="rounded-xl border border-white/10 bg-[#131127] p-5 space-y-5 text-white font-rajdhani font-semibold">
        {/* Component Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="font-orbitron text-sm font-bold tracking-wider text-white">THEME MANAGER</h2>
          </div>
          <span className="font-orbitron text-[9px] font-black text-gray-500 tracking-widest uppercase">
            STUDIO CONTROL
          </span>
        </div>

        {/* 1. PREVIEW PANEL */}
        <div className="space-y-1.5">
          <p className="font-orbitron text-[9px] font-black text-gray-400 tracking-widest uppercase">
            LIVE BROADCAST OVERLAY PREVIEW
          </p>
          <div 
            className="rounded-xl border border-white/15 overflow-hidden transition-all duration-500 relative" 
            style={{ backgroundColor: activePreviewTheme.bg }}
          >
            {/* Screen Header Bar */}
            <div 
              className="flex items-center justify-between px-3 py-2 border-b text-[10px] transition-all duration-300" 
              style={{ backgroundColor: activePreviewTheme.card, borderColor: `${activePreviewTheme.primary}25` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="font-orbitron font-black tracking-widest text-white/90">
                  {tournament?.name ? tournament.name.toUpperCase() : 'NEXPLAY BROADCAST STUDIO'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-orbitron text-[9px] tracking-wider text-white/50">
                <span>PREVIEWING:</span>
                <span className="font-black uppercase" style={{ color: activePreviewTheme.primary }}>
                  {activePreviewTheme.name}
                </span>
              </div>
            </div>

            {/* Simulated Screen Content Area */}
            <div className="p-4 space-y-3 relative" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
              
              {/* HUD Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* HUD Card 1 */}
                <div 
                  className="rounded-lg border p-2 flex items-center justify-between transition-all duration-300" 
                  style={{ backgroundColor: `${activePreviewTheme.card}e0`, borderColor: `${activePreviewTheme.primary}35` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: activePreviewTheme.primary }} />
                    <div className="truncate">
                      <div className="text-[7px] font-orbitron font-black text-white/40 tracking-widest uppercase leading-none mb-0.5">MATCH FEED</div>
                      <div className="text-[9px] font-bold text-white tracking-wide truncate">GRAND FINALS - MAP 3</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-orbitron font-black text-white/40 tracking-widest px-1.5 py-0.5 rounded border border-white/5 bg-white/5 flex-shrink-0">
                    LIVE
                  </span>
                </div>

                {/* HUD Card 2 */}
                <div 
                  className="rounded-lg border p-2 flex items-center justify-between transition-all duration-300" 
                  style={{ backgroundColor: `${activePreviewTheme.card}e0`, borderColor: `${activePreviewTheme.secondary}35` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: activePreviewTheme.secondary }} />
                    <div className="truncate">
                      <div className="text-[7px] font-orbitron font-black text-white/40 tracking-widest uppercase leading-none mb-0.5">CURRENT LEADER</div>
                      <div className="text-[9px] font-bold text-white tracking-wide truncate">TEAM REAPERS</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full animate-ping flex-shrink-0" style={{ backgroundColor: activePreviewTheme.accent }} />
                </div>
              </div>

              {/* Team Match Info Row */}
              <div 
                className="rounded-lg border overflow-hidden transition-all duration-300" 
                style={{ backgroundColor: `${activePreviewTheme.card}f5`, borderColor: `${activePreviewTheme.primary}25` }}
              >
                <div className="flex items-center justify-between h-8 px-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-black text-white flex-shrink-0" style={{ backgroundColor: activePreviewTheme.primary }}>A</span>
                    <span className="text-[10px] font-black text-white tracking-wide truncate">ALPHA ESPORTS</span>
                  </div>
                  
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black flex-shrink-0" 
                    style={{ backgroundColor: `${activePreviewTheme.bg}a0`, borderColor: `${activePreviewTheme.secondary}25`, color: activePreviewTheme.secondary }}
                  >
                    <span className="text-white">4</span>
                    <span className="text-white/35 font-normal">VS</span>
                    <span className="text-white">2</span>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0 justify-end">
                    <span className="text-[10px] font-black text-white tracking-wide truncate">TEAM OMEGA</span>
                    <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-black text-white flex-shrink-0" style={{ backgroundColor: activePreviewTheme.secondary }}>Ω</span>
                  </div>
                </div>
                {/* Visual Accent/Theme colored progress bars */}
                <div className="h-0.5 w-full flex">
                  <div className="h-full transition-all duration-300" style={{ width: '60%', backgroundColor: activePreviewTheme.primary }} />
                  <div className="h-full transition-all duration-300" style={{ width: '15%', backgroundColor: activePreviewTheme.accent }} />
                  <div className="h-full transition-all duration-300" style={{ width: '25%', backgroundColor: activePreviewTheme.secondary }} />
                </div>
              </div>

              {/* Kill Feed Alert Box */}
              <div 
                className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all duration-300" 
                style={{ backgroundColor: `${activePreviewTheme.card}f5`, borderColor: `${activePreviewTheme.accent}80` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-orbitron font-black text-[7px] px-1.5 py-0.5 rounded tracking-wider flex-shrink-0" style={{ backgroundColor: `${activePreviewTheme.accent}20`, color: activePreviewTheme.accent }}>
                    ELIMINATION
                  </span>
                  <span className="text-white font-bold truncate max-w-[80px]">ViperX</span>
                </div>
                
                <div 
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono tracking-widest flex-shrink-0" 
                  style={{ backgroundColor: `${activePreviewTheme.bg}ee`, borderColor: `${activePreviewTheme.accent}25`, color: activePreviewTheme.accent }}
                >
                  AK-47
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-white/50 truncate max-w-[80px]">ShadowGuy</span>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: activePreviewTheme.accent }} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. THEME GRID */}
        <div className="space-y-1.5">
          <p className="font-orbitron text-[9px] font-black text-gray-400 tracking-widest uppercase">
            SELECT PRESET THEME
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const isActive = isActiveTheme(theme);
              const isSelected = selectedTheme.id === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(theme);
                    // Pre-populate custom builder state to encourage tweaking
                    setCustomTheme({
                      id: 'custom',
                      name: theme.name === 'CUSTOM THEME' ? 'MY CUSTOM THEME' : `${theme.name} CUSTOM`,
                      primary: theme.primary,
                      secondary: theme.secondary,
                      bg: theme.bg,
                      card: theme.card,
                      accent: theme.accent,
                    });
                  }}
                  onMouseEnter={() => setHoveredTheme(theme)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  className={`relative flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all duration-300 disabled:opacity-40 group cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#1a1738] shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                      : 'border-white/10 bg-[#131127] hover:border-white/20 hover:bg-[#1a1835]'
                  }`}
                >
                  {/* Card Name & Badges */}
                  <div className="flex items-start justify-between w-full gap-2 mb-2">
                    <span className="font-orbitron text-[10px] font-black tracking-wider text-white uppercase leading-tight truncate">
                      {theme.name}
                    </span>
                    {isActive ? (
                      <span className="text-[7px] font-orbitron font-black text-[#22c55e] border border-[#22c55e]/30 bg-[#22c55e]/10 px-1.5 py-0.5 rounded tracking-widest flex-shrink-0 animate-pulse">
                        ACTIVE
                      </span>
                    ) : isSelected ? (
                      <span className="text-[7px] font-orbitron font-black text-[#7C3AED] border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-1.5 py-0.5 rounded tracking-widest flex-shrink-0">
                        SELECTED
                      </span>
                    ) : null}
                  </div>

                  {/* Small Mini Preview Bar */}
                  <div className="h-1.5 w-full rounded-full overflow-hidden flex mb-3 bg-white/5">
                    <div style={{ width: '40%', backgroundColor: theme.primary }} className="h-full transition-all duration-300" />
                    <div style={{ width: '30%', backgroundColor: theme.secondary }} className="h-full transition-all duration-300" />
                    <div style={{ width: '20%', backgroundColor: theme.card }} className="h-full transition-all duration-300" />
                    <div style={{ width: '10%', backgroundColor: theme.accent }} className="h-full transition-all duration-300" />
                  </div>

                  {/* Swatches Container */}
                  <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm block transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: theme.primary }}
                        title="Primary Color"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm block transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: theme.secondary }}
                        title="Secondary Color"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm block transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: theme.accent }}
                        title="Accent Color"
                      />
                    </div>
                    <span className="text-[7px] font-orbitron font-black tracking-widest text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      PREVIEW
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. CUSTOM THEME BUILDER (COLLAPSIBLE) */}
        <div className="border border-white/5 rounded-xl bg-black/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-black/40 hover:bg-black/60 transition-all duration-300 text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#7C3AED]" />
              <span className="font-orbitron text-[10px] font-black tracking-widest text-white uppercase">
                CUSTOM THEME BUILDER
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                {isCustomOpen ? 'COLLAPSE' : 'EXPAND'}
              </span>
              {isCustomOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>

          <div
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: isCustomOpen ? '500px' : '0px',
              opacity: isCustomOpen ? 1 : 0,
            }}
          >
            <form onSubmit={handleApplyCustom} className="p-4 border-t border-white/5 space-y-4">
              {/* Copy/Reset Action Bar */}
              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Quick Action: Tweak active/selected colors
                </span>
                <button
                  type="button"
                  onClick={handleLoadSelectedAsBase}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#7C3AED]/20 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/30 text-[#A78BFA] text-[9px] font-orbitron font-black tracking-widest uppercase transition-all"
                >
                  <Copy className="h-3 w-3" />
                  LOAD FROM PREVIEW
                </button>
              </div>

              {/* Theme Name input */}
              <div className="space-y-1.5">
                <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">
                  CUSTOM THEME NAME
                </label>
                <div className="relative">
                  <Paintbrush className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={customTheme.name}
                    onChange={(e) => handleCustomFieldChange('name', e.target.value)}
                    placeholder="Enter custom theme name..."
                    className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 font-orbitron text-[11px] text-white tracking-wider outline-none focus:border-[#7C3AED]/60"
                  />
                </div>
              </div>

              {/* Color Pickers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
                {/* Primary Picker */}
                <div className="flex items-center gap-2 bg-[#131127] border border-white/5 p-2 rounded-lg">
                  <div
                    className="relative w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-105"
                    style={{ backgroundColor: customTheme.primary }}
                  >
                    <input
                      type="color"
                      value={customTheme.primary}
                      onChange={(e) => handleCustomFieldChange('primary', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase leading-none mb-0.5">PRIMARY</span>
                    <span className="text-[10px] font-mono text-white/80 font-bold tracking-wide truncate">{customTheme.primary.toUpperCase()}</span>
                  </div>
                </div>

                {/* Secondary Picker */}
                <div className="flex items-center gap-2 bg-[#131127] border border-white/5 p-2 rounded-lg">
                  <div
                    className="relative w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-105"
                    style={{ backgroundColor: customTheme.secondary }}
                  >
                    <input
                      type="color"
                      value={customTheme.secondary}
                      onChange={(e) => handleCustomFieldChange('secondary', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase leading-none mb-0.5">SECONDARY</span>
                    <span className="text-[10px] font-mono text-white/80 font-bold tracking-wide truncate">{customTheme.secondary.toUpperCase()}</span>
                  </div>
                </div>

                {/* Accent Picker */}
                <div className="flex items-center gap-2 bg-[#131127] border border-white/5 p-2 rounded-lg">
                  <div
                    className="relative w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-105"
                    style={{ backgroundColor: customTheme.accent }}
                  >
                    <input
                      type="color"
                      value={customTheme.accent}
                      onChange={(e) => handleCustomFieldChange('accent', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase leading-none mb-0.5">ACCENT</span>
                    <span className="text-[10px] font-mono text-white/80 font-bold tracking-wide truncate">{customTheme.accent.toUpperCase()}</span>
                  </div>
                </div>

                {/* Background Picker */}
                <div className="flex items-center gap-2 bg-[#131127] border border-white/5 p-2 rounded-lg">
                  <div
                    className="relative w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-105"
                    style={{ backgroundColor: customTheme.bg }}
                  >
                    <input
                      type="color"
                      value={customTheme.bg}
                      onChange={(e) => handleCustomFieldChange('bg', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase leading-none mb-0.5">BACKGROUND</span>
                    <span className="text-[10px] font-mono text-white/80 font-bold tracking-wide truncate">{customTheme.bg.toUpperCase()}</span>
                  </div>
                </div>

                {/* Card Picker */}
                <div className="flex items-center gap-2 bg-[#131127] border border-white/5 p-2 rounded-lg">
                  <div
                    className="relative w-8 h-8 rounded-full border border-white/20 cursor-pointer overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-105"
                    style={{ backgroundColor: customTheme.card }}
                  >
                    <input
                      type="color"
                      value={customTheme.card}
                      onChange={(e) => handleCustomFieldChange('card', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase leading-none mb-0.5">CARD</span>
                    <span className="text-[10px] font-mono text-white/80 font-bold tracking-wide truncate">{customTheme.card.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Apply Custom Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 py-2.5 text-[10px] font-orbitron font-black tracking-widest text-white hover:bg-[#7C3AED]/35 active:scale-[0.99] transition-all duration-300 uppercase flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                SAVE & APPLY CUSTOM THEME
              </button>
            </form>
          </div>
        </div>

        {/* 4. APPLY BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleApplySelected}
            className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] py-3.5 text-xs font-orbitron font-black tracking-widest text-white hover:from-[#6D28D9] hover:to-[#2563EB] active:scale-[0.99] transition-all duration-300 shadow-lg shadow-[#7C3AED]/10 flex items-center justify-center gap-2 uppercase"
          >
            <Palette className="h-4 w-4" />
            APPLY THEME TO TOURNAMENT
          </button>
        </div>
      </div>
    </SectionBoundary>
  );
}
