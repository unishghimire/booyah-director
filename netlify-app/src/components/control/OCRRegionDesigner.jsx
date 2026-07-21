import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Clock,
  Skull,
  Trophy,
  Target,
  Award,
  Plus,
  Save,
  Trash2,
  Eye,
  Settings,
  List,
  Check,
  AlertCircle,
  Info,
  X,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';

// Mandated design system colors and fonts:
// Background: #04060E, Cards: #131127
// Primary purple: #7C3AED, Secondary blue: #3B82F6
// Accent green: #22c55e, red: #ef4444, amber: #f59e0b

export const REGION_TYPES = [
  { key: 'alive_counter', label: 'ALIVE COUNTER', icon: 'Users', color: '#22c55e', desc: 'Detects alive player count' },
  { key: 'timer', label: 'MATCH TIMER', icon: 'Clock', color: '#3B82F6', desc: 'Detects remaining time' },
  { key: 'kill_feed', label: 'KILL FEED', icon: 'Skull', color: '#ef4444', desc: 'Detects kill notifications' },
  { key: 'winner', label: 'WINNER BANNER', icon: 'Trophy', color: '#FBBF24', desc: 'Detects Booyah/winner screen' },
  { key: 'zone', label: 'SAFE ZONE', icon: 'Target', color: '#f59e0b', desc: 'Detects zone shrink notifications' },
  { key: 'placement', label: 'PLACEMENT', icon: 'Award', color: '#7C3AED', desc: 'Detects final placement' },
];

const ICON_MAP = {
  Users,
  Clock,
  Skull,
  Trophy,
  Target,
  Award
};

const DEFAULT_PROFILES = {
  'Bermuda Profile': [
    { id: 'bermuda_alive', type: 'alive_counter', x: 1680, y: 40, width: 140, height: 60 },
    { id: 'bermuda_timer', type: 'timer', x: 910, y: 40, width: 100, height: 50 },
    { id: 'bermuda_kill', type: 'kill_feed', x: 60, y: 350, width: 320, height: 180 },
    { id: 'bermuda_zone', type: 'zone', x: 860, y: 150, width: 200, height: 60 }
  ],
  'Purgatory Profile': [
    { id: 'purgatory_alive', type: 'alive_counter', x: 1700, y: 35, width: 130, height: 55 },
    { id: 'purgatory_timer', type: 'timer', x: 900, y: 35, width: 120, height: 50 },
    { id: 'purgatory_kill', type: 'kill_feed', x: 80, y: 320, width: 300, height: 200 }
  ],
  'Kalahari Profile': [
    { id: 'kalahari_alive', type: 'alive_counter', x: 1650, y: 45, width: 150, height: 65 },
    { id: 'kalahari_timer', type: 'timer', x: 920, y: 45, width: 90, height: 45 },
    { id: 'kalahari_winner', type: 'winner', x: 760, y: 380, width: 400, height: 150 }
  ]
};

const MOCK_INITIAL_LOGS = [
  { id: 1, timestamp: '22:18:45', type: 'timer', value: '14:32', confidence: 97, corrected: false },
  { id: 2, timestamp: '22:18:46', type: 'alive_counter', value: '42', confidence: 89, corrected: false },
  { id: 3, timestamp: '22:18:48', type: 'kill_feed', value: 'Alpha_K9 killed Beta_X [AK47]', confidence: 74, corrected: true },
  { id: 4, timestamp: '22:18:50', type: 'zone', value: 'Safe zone shrinking in 30s', confidence: 93, corrected: false },
  { id: 5, timestamp: '22:18:52', type: 'placement', value: 'Booyah! Winner Team #4', confidence: 45, corrected: true }
];

const getTimestamp = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0]; // "HH:MM:SS"
};

export default function OCRRegionDesigner({ regions, onSaveRegions }) {
  // --- Profile state ---
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('nexplay_ocr_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing profiles from localStorage:', e);
      }
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileName, setActiveProfileName] = useState('Bermuda Profile');
  const [profileNameInput, setProfileNameInput] = useState('Bermuda Profile');
  
  // --- Main active regions state ---
  const [activeRegions, setActiveRegions] = useState(() => {
    return DEFAULT_PROFILES['Bermuda Profile'];
  });

  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedTypeKey, setSelectedTypeKey] = useState('alive_counter');

  // --- Drawing state ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // --- OCR Settings state ---
  const [captureInterval, setCaptureInterval] = useState(1000);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [autoCorrection, setAutoCorrection] = useState(true);
  const [aiCorrection, setAiCorrection] = useState(false);
  const [detectionLogEnabled, setDetectionLogEnabled] = useState(true);

  // --- Logs and Simulation ---
  const [logs, setLogs] = useState(MOCK_INITIAL_LOGS);
  const [isSimulating, setIsSimulating] = useState(true);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState('game'); // 'grid' or 'game'

  const canvasRef = useRef(null);

  // Sync state if regions come down from parent
  useEffect(() => {
    if (regions && Array.isArray(regions) && regions.length > 0) {
      setActiveRegions(regions);
    }
  }, [regions]);

  // Sync profiles back to localStorage on change
  useEffect(() => {
    localStorage.setItem('nexplay_ocr_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // CAD-style mouse tracking for bounding box drawing
  useEffect(() => {
    if (!isDrawing) return;

    const handleGlobalMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate mouse position relative to canvas
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      // Clamp coords within the physical container
      const clampedX = Math.max(0, Math.min(rect.width, relativeX));
      const clampedY = Math.max(0, Math.min(rect.height, relativeY));

      // Map to 1920x1080 resolution
      const px = Math.round((clampedX / rect.width) * 1920);
      const py = Math.round((clampedY / rect.height) * 1080);

      setCurrentX(px);
      setCurrentY(py);
    };

    const handleGlobalUp = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const clampedX = Math.max(0, Math.min(rect.width, relativeX));
      const clampedY = Math.max(0, Math.min(rect.height, relativeY));

      const px = Math.round((clampedX / rect.width) * 1920);
      const py = Math.round((clampedY / rect.height) * 1080);

      const finalX = Math.min(startX, px);
      const finalY = Math.min(startY, py);
      const finalW = Math.abs(px - startX);
      const finalH = Math.abs(py - startY);

      // Filter accidental micro-draws or double clicks
      if (finalW > 15 && finalH > 15) {
        const typeDef = REGION_TYPES.find(r => r.key === selectedTypeKey);
        
        const newRegion = {
          id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: selectedTypeKey,
          x: finalX,
          y: finalY,
          width: finalW,
          height: finalH
        };

        const updated = [...activeRegions, newRegion];
        setActiveRegions(updated);
        setSelectedRegionId(newRegion.id);
        onSaveRegions?.(updated);
        toast.success(`Created region: ${typeDef?.label}`);
      } else {
        // Simple click was performed - could mean deselection if clicked empty space
        const distance = Math.max(finalW, finalH);
        if (distance < 5) {
          setSelectedRegionId(null);
        }
      }

      setIsDrawing(false);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDrawing, startX, startY, selectedTypeKey, activeRegions, onSaveRegions]);

  // Real-time OCR data simulator loop
  useEffect(() => {
    if (!isSimulating || !detectionLogEnabled) return;

    const interval = setInterval(() => {
      const activeKeys = activeRegions.length > 0 
        ? activeRegions.map(r => r.type)
        : REGION_TYPES.map(r => r.key);

      const randomType = activeKeys[Math.floor(Math.random() * activeKeys.length)];
      let mockVal = '';
      const mockConf = Math.floor(Math.random() * 55) + 45; // 45% - 100%

      switch (randomType) {
        case 'timer': {
          const mins = String(Math.floor(Math.random() * 12) + 2).padStart(2, '0');
          const secs = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          mockVal = `${mins}:${secs}`;
          break;
        }
        case 'alive_counter': {
          mockVal = String(Math.floor(Math.random() * 45) + 1);
          break;
        }
        case 'kill_feed': {
          const killers = ['Alpha_Esports', 'NexPlay_Faker', 'SilentStriker', 'GodLuffy', 'Caster_Slayer', 'T1_Zeus'];
          const victims = ['Bot_Zero', 'NoobShooter', 'Headhunter', 'SoloRanger', 'Caster_A', 'GenG_Doran'];
          const weapons = ['AWM', 'M4A1', 'M1887', 'MP40', 'SVD', 'Grenade'];
          const killer = killers[Math.floor(Math.random() * killers.length)];
          const victim = victims[Math.floor(Math.random() * victims.length)];
          const weapon = weapons[Math.floor(Math.random() * weapons.length)];
          mockVal = `${killer} 🔫 ${victim} [${weapon}]`;
          break;
        }
        case 'winner': {
          mockVal = Math.random() > 0.4 ? 'BOOYAH!' : 'VICTORY BANNER (WINNER)';
          break;
        }
        case 'zone': {
          mockVal = Math.random() > 0.5 ? 'WARNING: ZONE SHRINK IN 30s' : 'SAFE ZONE EXPANDING';
          break;
        }
        case 'placement': {
          mockVal = `Team Ranked #${Math.floor(Math.random() * 8) + 1} Notification`;
          break;
        }
        default:
          mockVal = 'Stream Feed Status OK';
      }

      const corrected = mockConf < 80 && autoCorrection;

      const newLog = {
        id: Date.now(),
        timestamp: getTimestamp(),
        type: randomType,
        value: mockVal,
        confidence: mockConf,
        corrected: corrected
      };

      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, captureInterval);

    return () => clearInterval(interval);
  }, [isSimulating, detectionLogEnabled, activeRegions, autoCorrection, captureInterval]);

  // --- Profile handlers ---
  const handleProfileChange = (pName) => {
    setActiveProfileName(pName);
    setProfileNameInput(pName);
    const loadedRegions = profiles[pName] || [];
    setActiveRegions(loadedRegions);
    setSelectedRegionId(null);
    onSaveRegions?.(loadedRegions);
    toast.success(`Loaded profile: ${pName}`);
  };

  const handleSaveProfile = () => {
    const trimmedName = profileNameInput.trim();
    if (!trimmedName) {
      toast.error('Profile name cannot be empty');
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [trimmedName]: activeRegions
    };

    setProfiles(updatedProfiles);
    setActiveProfileName(trimmedName);
    onSaveRegions?.(activeRegions);
    toast.success(`Saved profile: ${trimmedName}`);
  };

  const handleNewProfile = () => {
    const baseName = 'New Custom Profile';
    let finalName = baseName;
    let count = 1;
    while (profiles[finalName]) {
      finalName = `${baseName} ${count}`;
      count++;
    }

    setActiveProfileName(finalName);
    setProfileNameInput(finalName);
    setActiveRegions([]);
    setSelectedRegionId(null);
    toast.success('Started new blank profile. Drag to draw bounding areas!');
  };

  const handleDeleteProfile = () => {
    if (Object.keys(DEFAULT_PROFILES).includes(activeProfileName)) {
      toast.error('Cannot delete default system layouts');
      return;
    }

    const updated = { ...profiles };
    delete updated[activeProfileName];
    setProfiles(updated);

    // Swap back to Bermuda Profile
    setActiveProfileName('Bermuda Profile');
    setProfileNameInput('Bermuda Profile');
    setActiveRegions(updated['Bermuda Profile'] || []);
    setSelectedRegionId(null);
    toast.success(`Deleted profile: ${activeProfileName}`);
  };

  // --- Canvas Handlers ---
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Standard left click only
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    const px = Math.round((relativeX / rect.width) * 1920);
    const py = Math.round((relativeY / rect.height) * 1080);

    setIsDrawing(true);
    setStartX(px);
    setStartY(py);
    setCurrentX(px);
    setCurrentY(py);
  };

  const handleDeleteRegion = (id) => {
    const updated = activeRegions.filter(r => r.id !== id);
    setActiveRegions(updated);
    if (selectedRegionId === id) {
      setSelectedRegionId(null);
    }
    onSaveRegions?.(updated);
    toast.success('Region removed');
  };

  // Render simulated HUD elements in the background to assist with manual alignment
  const renderSimulatedHUD = () => {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Crosshair ornament */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-10 h-px bg-white" />
          <div className="h-10 w-px bg-white" />
          <div className="w-6 h-6 rounded-full border border-white" />
        </div>

        {/* Alive Counter mockup */}
        <div
          style={{ left: '87.5%', top: '3.7%', width: '7.3%', height: '5.5%' }}
          className="absolute border border-dashed border-emerald-500/20 bg-emerald-950/10 flex flex-col items-center justify-center rounded p-1"
        >
          <span className="font-orbitron text-[5px] text-emerald-400 font-black tracking-widest leading-none">ALIVE HUD</span>
          <span className="font-teko text-[10px] text-white leading-none font-bold">ALIVE: 42</span>
        </div>

        {/* Timer mockup */}
        <div
          style={{ left: '47.4%', top: '3.7%', width: '5.2%', height: '4.6%' }}
          className="absolute border border-dashed border-blue-500/20 bg-blue-950/10 flex flex-col items-center justify-center rounded p-1"
        >
          <span className="font-orbitron text-[5px] text-blue-400 font-black tracking-widest leading-none">TIMER HUD</span>
          <span className="font-mono text-[9px] text-white leading-none font-bold">14:32</span>
        </div>

        {/* Kill Feed mockup */}
        <div
          style={{ left: '3.1%', top: '32.4%', width: '16.7%', height: '16.7%' }}
          className="absolute border border-dashed border-red-500/20 bg-red-950/10 flex flex-col justify-start rounded p-1.5 space-y-0.5"
        >
          <span className="font-orbitron text-[5px] text-red-400 font-black tracking-widest leading-none mb-0.5">FEED HUD</span>
          <div className="font-mono text-[6px] text-white/80 space-y-0.5 leading-tight">
            <p className="truncate"><span className="text-red-400">🔥 Faker</span> killed <span className="text-blue-400">Noob</span></p>
            <p className="truncate"><span className="text-red-400">🔥 Luffy</span> killed <span className="text-blue-400">Kaido</span></p>
            <p className="truncate"><span className="text-red-400">🔥 s1mple</span> killed <span className="text-blue-400">Zywoo</span></p>
          </div>
        </div>

        {/* Zone mockup */}
        <div
          style={{ left: '44.8%', top: '13.9%', width: '10.4%', height: '5.5%' }}
          className="absolute border border-dashed border-amber-500/20 bg-amber-950/10 flex flex-col items-center justify-center rounded p-1"
        >
          <span className="font-orbitron text-[5px] text-amber-400 font-black tracking-widest leading-none">ZONE HUD</span>
          <span className="font-orbitron text-[7px] text-amber-400 font-black leading-none animate-pulse">SAFE ZONE!</span>
        </div>

        {/* Placement HUD mockup */}
        <div
          style={{ left: '42.2%', top: '24.1%', width: '15.6%', height: '9.3%' }}
          className="absolute border border-dashed border-purple-500/20 bg-purple-950/10 flex flex-col items-center justify-center rounded p-1"
        >
          <span className="font-orbitron text-[5px] text-purple-400 font-black tracking-widest leading-none">PLACEMENT HUD</span>
          <span className="font-orbitron text-[8px] text-white leading-none font-bold">TOP 5 ALIVE</span>
        </div>

        {/* Winner Screen HUD mockup */}
        <div
          style={{ left: '39.6%', top: '35.2%', width: '20.8%', height: '13.9%' }}
          className="absolute border border-dashed border-yellow-500/20 bg-yellow-950/10 flex flex-col items-center justify-center rounded p-1"
        >
          <span className="font-orbitron text-[5px] text-yellow-400 font-black tracking-widest leading-none">WINNER HUD</span>
          <span className="font-orbitron text-[10px] text-yellow-400 font-black tracking-widest leading-none">BOOYAH!</span>
        </div>

        {/* HP Bar mockup at bottom */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-black/60 border border-white/5 rounded overflow-hidden flex items-center p-0.5">
          <div className="h-full w-[85%] bg-emerald-500 rounded-sm" />
        </div>
      </div>
    );
  };

  // Render temporary bounding box during drag-to-draw gesture
  const renderTemporaryDrawingRectangle = () => {
    const selectedType = REGION_TYPES.find(r => r.key === selectedTypeKey) || REGION_TYPES[0];
    const drawX = Math.min(startX, currentX);
    const drawY = Math.min(startY, currentY);
    const drawW = Math.abs(currentX - startX);
    const drawH = Math.abs(currentY - startY);

    return (
      <div
        style={{
          position: 'absolute',
          left: `${(drawX / 1920) * 100}%`,
          top: `${(drawY / 1080) * 100}%`,
          width: `${(drawW / 1920) * 100}%`,
          height: `${(drawH / 1080) * 100}%`,
          border: `2px dashed ${selectedType.color}`,
          background: `${selectedType.color}15`,
          pointerEvents: 'none',
          zIndex: 50
        }}
        className="flex items-center justify-center text-white"
      >
        <div className="bg-[#131127]/90 border border-white/20 p-1.5 rounded flex flex-col items-center gap-0.5 shadow-lg max-w-[150px]">
          <span className="font-orbitron text-[7px] font-black tracking-wider text-center" style={{ color: selectedType.color }}>
            DRAWING: {selectedType.label}
          </span>
          <span className="font-mono text-[7px] text-gray-400">
            X:{drawX} Y:{drawY}
          </span>
          <span className="font-mono text-[7px] text-gray-400">
            W:{drawW} H:{drawH}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#04060E] text-white font-rajdhani p-4 md:p-6 space-y-6 rounded-2xl border border-white/5 relative overflow-hidden">
      {/* Background neon ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* --- TOP BAR PROFILE MANAGER --- */}
      <div className="bg-[#131127] border border-white/10 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <h1 className="font-orbitron text-base font-black tracking-widest text-white flex items-center gap-1.5">
              NEXPLAY BROADCAST OCR DESIGNER
            </h1>
          </div>
          <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mt-0.5">
            Real-time optical character recognition visual zone mapper
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2.5 rounded-lg border border-white/5">
          {/* Layout profile select dropdown */}
          <div className="flex flex-col">
            <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5 uppercase">
              SELECT LAYOUT
            </span>
            <select
              value={activeProfileName}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="rounded bg-[#131127] border border-white/10 px-2 py-1 text-xs font-orbitron font-bold text-white focus:border-[#7C3AED]/50 outline-none h-8 min-w-[150px] cursor-pointer"
            >
              {Object.keys(profiles).map((name) => (
                <option key={name} value={name}>
                  {name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Name input field */}
          <div className="flex flex-col">
            <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5 uppercase">
              PROFILE NAME
            </span>
            <input
              type="text"
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
              className="rounded bg-[#131127] border border-white/10 px-2.5 py-1 text-xs font-orbitron font-bold text-white focus:border-[#7C3AED]/50 outline-none h-8 w-[150px]"
              placeholder="Layout name"
            />
          </div>

          {/* Profile control buttons */}
          <div className="flex items-end gap-1.5 h-8 mt-auto">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[10px] font-orbitron font-black tracking-widest px-3 h-full rounded transition-all duration-150 border border-[#7C3AED]"
              title="Save Profile"
            >
              <Save className="h-3.5 w-3.5" />
              <span>SAVE</span>
            </button>

            <button
              onClick={handleNewProfile}
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-orbitron font-black tracking-widest px-3 h-full rounded border border-white/10 transition-all duration-150"
              title="Create New Profile"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>NEW</span>
            </button>

            {/* Render custom deletion button only if not default profile layout */}
            {!Object.keys(DEFAULT_PROFILES).includes(activeProfileName) && (
              <button
                onClick={handleDeleteProfile}
                className="flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 h-full w-8 rounded transition-all duration-150"
                title="Delete Custom Profile"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- MAIN SPLIT LAYOUT WORKSPACE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN (COLSPAN 8): Canvas + OCR Settings + Logs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* 1. Capture Preview Canvas */}
          <div className="bg-[#131127] rounded-xl border border-white/10 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-400" />
                <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                  CAPTURE VIEWPORT (1920x1080 MATCH SPACE)
                </h3>
              </div>

              {/* Toggle backgrounds inside canvas */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded border border-white/5">
                <button
                  onClick={() => setCanvasBackground('grid')}
                  className={`font-orbitron text-[8px] font-black tracking-widest px-2.5 py-1 rounded transition-all duration-150 ${
                    canvasBackground === 'grid'
                      ? 'bg-[#7C3AED] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RAW GRID
                </button>
                <button
                  onClick={() => setCanvasBackground('game')}
                  className={`font-orbitron text-[8px] font-black tracking-widest px-2.5 py-1 rounded transition-all duration-150 ${
                    canvasBackground === 'game'
                      ? 'bg-[#7C3AED] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  HUD ALIGNMENT
                </button>
              </div>
            </div>

            {/* Aspect container 16:9 */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              style={{
                backgroundImage: canvasBackground === 'grid'
                  ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
                  : 'none',
                backgroundSize: '20px 20px',
                backgroundColor: '#020308'
              }}
              className="w-full aspect-[16/9] border border-white/10 rounded-xl overflow-hidden relative cursor-crosshair shadow-2xl select-none"
            >
              {/* HUD Placement layer to assist user alignment */}
              {canvasBackground === 'game' && renderSimulatedHUD()}

              {/* Render Bounding Boxes */}
              {activeRegions.map((region) => {
                const typeDef = REGION_TYPES.find(r => r.key === region.type) || {
                  label: 'UNKNOWN',
                  color: '#ffffff'
                };
                const isSelected = selectedRegionId === region.id;

                return (
                  <div
                    key={region.id}
                    onClick={(e) => {
                      e.stopPropagation(); // Block canvas redraw click
                      setSelectedRegionId(region.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${(region.x / 1920) * 100}%`,
                      top: `${(region.y / 1080) * 100}%`,
                      width: `${(region.width / 1920) * 100}%`,
                      height: `${(region.height / 1080) * 100}%`,
                      border: `2px solid ${isSelected ? '#ffffff' : typeDef.color}`,
                      background: isSelected ? `${typeDef.color}25` : `${typeDef.color}08`,
                      boxShadow: isSelected ? `0 0 14px ${typeDef.color}aa` : 'none',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      zIndex: isSelected ? 30 : 10
                    }}
                    className="group cursor-pointer flex flex-col justify-between p-1"
                  >
                    {/* Header bar of rectangle */}
                    <div className="flex items-center justify-between w-full pointer-events-none">
                      <span
                        style={{ backgroundColor: typeDef.color }}
                        className="font-orbitron font-black text-[7px] text-black px-1 rounded tracking-wider leading-none py-0.5 uppercase truncate"
                      >
                        {typeDef.label}
                      </span>
                      <span className="font-mono text-[7px] text-white bg-black/60 px-0.5 rounded leading-none hidden group-hover:inline-block">
                        {region.width}x{region.height}
                      </span>
                    </div>

                    {/* Footer coords */}
                    <div className="w-full pointer-events-none flex items-end justify-between mt-auto">
                      <span className="font-mono text-[6.5px] text-gray-300 bg-black/50 px-1 rounded leading-none">
                        [{region.x}, {region.y}]
                      </span>
                    </div>

                    {/* Self-contained delete button in the top right of bounding box */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRegion(region.id);
                      }}
                      style={{ backgroundColor: typeDef.color }}
                      className="absolute -top-1.5 -right-1.5 text-black hover:scale-110 active:scale-95 rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-150 z-40"
                    >
                      <X className="h-2 w-2 stroke-[3.5]" />
                    </button>
                  </div>
                );
              })}

              {/* Bounding box rendering during drag action */}
              {isDrawing && renderTemporaryDrawingRectangle()}

              {/* Grid empty instruction */}
              {activeRegions.length === 0 && canvasBackground === 'grid' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                  <Layers className="h-7 w-7 text-gray-600 mb-2 animate-bounce" />
                  <p className="font-orbitron text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    DRAG CURSOR TO MAP OCR AREA
                  </p>
                  <p className="text-[9px] text-gray-500 max-w-[280px] mt-1">
                    Select a target mapping region from the right panel, then drag click inside this grid box.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. OCR Settings Panel */}
          <div className="bg-[#131127] rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Settings className="h-4 w-4 text-purple-400" />
              <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                OCR ENGINE CONFIGURATION
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sliders */}
              <div className="space-y-4">
                {/* Capture interval slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-orbitron text-[8px] font-black text-gray-400 tracking-widest uppercase">
                      CAPTURE ENGINE REFRESH RATE
                    </label>
                    <span className="font-teko text-base text-purple-400 tracking-wider">
                      {captureInterval}MS
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={captureInterval}
                    onChange={(e) => setCaptureInterval(Number(e.target.value))}
                    className="w-full accent-[#7C3AED] bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[7.5px] text-gray-500 font-mono">
                    <span>100MS (LIVE-SYNC)</span>
                    <span>5000MS (BATTERY SAVER)</span>
                  </div>
                </div>

                {/* Confidence minimum slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-orbitron text-[8px] font-black text-gray-400 tracking-widest uppercase">
                      MINIMUM OCR CONFIDENCE VALUE
                    </label>
                    <span className="font-teko text-base text-purple-400 tracking-wider">
                      {confidenceThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-[#7C3AED] bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[7.5px] text-gray-500 font-mono">
                    <span>0% (LOG EVERYTHING)</span>
                    <span>100% (STRICT EXACT MATCH)</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/20 p-2.5 rounded-lg border border-white/5 h-fit self-center">
                {/* Auto Correction toggle */}
                <div className="flex items-center justify-between p-1 bg-black/30 rounded border border-white/5">
                  <div className="min-w-0">
                    <p className="font-orbitron text-[8px] font-black tracking-widest text-white truncate">SPELL-CORRECT</p>
                    <p className="text-[7.5px] text-gray-500 leading-none">Dictionary checks</p>
                  </div>
                  <button
                    onClick={() => setAutoCorrection(!autoCorrection)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${autoCorrection ? 'bg-[#7C3AED]' : 'bg-gray-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${autoCorrection ? 'left-[14px]' : 'left-[2px]'}`} />
                  </button>
                </div>

                {/* AI correction toggle */}
                <div className="flex items-center justify-between p-1 bg-black/30 rounded border border-white/5">
                  <div className="min-w-0">
                    <p className="font-orbitron text-[8px] font-black tracking-widest text-white truncate">AI PREDICTOR</p>
                    <p className="text-[7.5px] text-gray-500 leading-none">Heuristics parser</p>
                  </div>
                  <button
                    onClick={() => setAiCorrection(!aiCorrection)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${aiCorrection ? 'bg-[#7C3AED]' : 'bg-gray-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${aiCorrection ? 'left-[14px]' : 'left-[2px]'}`} />
                  </button>
                </div>

                {/* Detection log status toggle */}
                <div className="flex items-center justify-between p-1 bg-black/30 rounded border border-white/5">
                  <div className="min-w-0">
                    <p className="font-orbitron text-[8px] font-black tracking-widest text-white truncate">LOG WRITES</p>
                    <p className="text-[7.5px] text-gray-500 leading-none">Write telemetry</p>
                  </div>
                  <button
                    onClick={() => setDetectionLogEnabled(!detectionLogEnabled)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${detectionLogEnabled ? 'bg-[#7C3AED]' : 'bg-gray-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${detectionLogEnabled ? 'left-[14px]' : 'left-[2px]'}`} />
                  </button>
                </div>

                {/* Simulated Generator Feed toggle */}
                <div className="flex items-center justify-between p-1 bg-black/30 rounded border border-white/5">
                  <div className="min-w-0">
                    <p className="font-orbitron text-[8px] font-black tracking-widest text-emerald-400 truncate flex items-center gap-0.5">
                      <span className={`w-1 h-1 rounded-full bg-emerald-400 ${isSimulating ? 'animate-ping' : ''}`} />
                      MOCK SIM
                    </p>
                    <p className="text-[7.5px] text-gray-500 leading-none">Simulate inputs</p>
                  </div>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${isSimulating ? 'bg-emerald-500' : 'bg-gray-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${isSimulating ? 'left-[14px]' : 'left-[2px]'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Detection Log (Collapsible) */}
          <div className="bg-[#131127] rounded-xl border border-white/10 overflow-hidden">
            <div
              onClick={() => setLogCollapsed(!logCollapsed)}
              className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-all duration-150 border-b border-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-purple-400" />
                <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase flex items-center gap-2">
                  <span>OCR CAPTURE SIGNAL LOG</span>
                  {isSimulating && (
                    <span className="text-[7.5px] font-orbitron font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse leading-none">
                      STREAM ACTIVE
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                {logs.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogs([]);
                      toast.success('Detections log database cleared');
                    }}
                    className="text-[8px] font-orbitron font-black tracking-widest text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors"
                  >
                    RESET LOGS
                  </button>
                )}
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${logCollapsed ? '' : 'rotate-90'}`} />
              </div>
            </div>

            {!logCollapsed && (
              <div className="p-4 bg-black/30 max-h-[250px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="font-orbitron text-[9px] font-black text-gray-500 tracking-wider uppercase">NO MATCH METRIC ENTRIES FOUND</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">Toggle 'MOCK SIM' above or draw areas on HUD to capture telemetry data.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500 text-[8px] font-orbitron tracking-widest uppercase">
                          <th className="pb-1.5 font-black">TIMESTAMP</th>
                          <th className="pb-1.5 font-black">DETECTION CLASSIFIER</th>
                          <th className="pb-1.5 font-black">CAPTURED STRING VALUE</th>
                          <th className="pb-1.5 font-black">CONFIDENCE</th>
                          <th className="pb-1.5 font-black">AI PARSED</th>
                          <th className="pb-1.5 text-right font-black">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                        {logs.map((log) => {
                          const typeDef = REGION_TYPES.find(r => r.key === log.type) || {
                            label: 'UNKNOWN',
                            color: '#ffffff'
                          };

                          let isHigh = log.confidence >= 80;
                          let isMid = log.confidence >= 50 && log.confidence < 80;

                          return (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2 text-gray-400 font-teko text-sm tracking-widest">{log.timestamp}</td>
                              <td className="py-2">
                                <span
                                  style={{ color: typeDef.color, borderColor: `${typeDef.color}25` }}
                                  className="font-orbitron font-black text-[8px] tracking-wider px-1.5 py-0.5 border bg-black/40 rounded leading-none inline-block"
                                >
                                  {typeDef.label}
                                </span>
                              </td>
                              <td className="py-2 text-white font-black truncate max-w-[160px]">{log.value}</td>
                              <td className="py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                  isHigh ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/10' :
                                  isMid ? 'text-amber-400 bg-amber-500/15 border-amber-500/10' :
                                  'text-red-400 bg-red-500/15 border-red-500/10'
                                }`}>
                                  {log.confidence}%
                                </span>
                              </td>
                              <td className="py-2">
                                {log.corrected ? (
                                  <span className="font-orbitron text-[8px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-0.5 rounded leading-none uppercase tracking-wider inline-block">
                                    CORRECTED
                                  </span>
                                ) : (
                                  <span className="text-gray-600 text-[8.5px]">N/A</span>
                                )}
                              </td>
                              <td className="py-2 text-right">
                                <span className={`inline-flex items-center justify-center p-0.5 rounded-full border bg-black/40 ${
                                  isHigh ? 'border-emerald-500/40' : isMid ? 'border-amber-500/40' : 'border-red-500/40'
                                }`}>
                                  <Check className={`h-3 w-3 ${
                                    isHigh ? 'text-emerald-500' : isMid ? 'text-amber-500' : 'text-red-500'
                                  }`} />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (COLSPAN 4): Selector + Active List */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* 1. Region Type Selector */}
          <div className="bg-[#131127] rounded-xl border border-white/10 p-4 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                TARGET CLASSIFIER LIST
              </h3>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-tight">
              SELECT THE ACTIVE CLASSIFIER TARGET BELOW, THEN DRAW THE RESPECTIVE RECTANGLE REGION ONTO THE HUD MAP AREA.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {REGION_TYPES.map((type) => {
                const isSelected = selectedTypeKey === type.key;
                const Icon = ICON_MAP[type.icon] || Info;

                return (
                  <button
                    key={type.key}
                    onClick={() => setSelectedTypeKey(type.key)}
                    className="flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer"
                    style={{
                      borderColor: isSelected ? type.color : 'rgba(255,255,255,0.05)',
                      background: isSelected ? `${type.color}15` : 'rgba(255,255,255,0.02)',
                      boxShadow: isSelected ? `0 0 10px ${type.color}20` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5" style={{ color: type.color }} />
                      <span className="font-orbitron text-[9px] font-black tracking-widest text-white uppercase">
                        {type.label}
                      </span>
                    </div>
                    {isSelected && (
                      <p className="text-[9px] text-gray-400 leading-tight font-medium">
                        {type.desc}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Active Regions List */}
          <div className="bg-[#131127] rounded-xl border border-white/10 p-4 space-y-3 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-purple-400" />
                <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                  ACTIVE HUD REGIONS
                </h3>
              </div>
              <span className="font-teko text-xl text-purple-400 tracking-wider">
                {activeRegions.length}/6
              </span>
            </div>

            {activeRegions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black/20 rounded-lg border border-dashed border-white/5">
                <Info className="h-6 w-6 text-gray-600 mb-1.5" />
                <p className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">
                  NO REGIONS DRAWN
                </p>
                <p className="text-[9px] text-gray-600 mt-1 max-w-[160px]">
                  Layout region mapping database is blank. Drag-select on HUD grid layout to save.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-[350px] pr-1">
                {activeRegions.map((region) => {
                  const typeDef = REGION_TYPES.find(r => r.key === region.type) || {
                    label: 'UNKNOWN',
                    icon: 'Info',
                    color: '#ffffff'
                  };
                  const Icon = ICON_MAP[typeDef.icon] || Info;
                  const isSelected = selectedRegionId === region.id;

                  return (
                    <div
                      key={region.id}
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-white/5 border-white/25 shadow-lg shadow-black/40'
                          : 'bg-black/30 border-white/5 hover:border-white/12 hover:bg-black/40'
                      }`}
                    >
                      {/* Left color bar indicator */}
                      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: typeDef.color }} />
                      
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: typeDef.color }} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-orbitron text-[9px] font-black tracking-wider text-white truncate uppercase">
                            {typeDef.label}
                          </span>
                          {isSelected && <span className="w-1 h-1 rounded-full bg-white animate-ping" />}
                        </div>
                        <div className="font-mono text-[8px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <span className="bg-black/40 px-1 py-0.5 rounded text-gray-400">X:{region.x} Y:{region.y}</span>
                          <span className="bg-black/40 px-1 py-0.5 rounded text-gray-400">{region.width}x{region.height}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRegion(region.id);
                        }}
                        className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                        title="Delete Region"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
