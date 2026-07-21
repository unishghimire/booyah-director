import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder,
  Image as ImageIcon,
  Video,
  Music,
  Type,
  Layers,
  Search,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  X,
  Copy,
  Plus,
  Check,
  ChevronDown,
  RefreshCw,
  FileText,
  Globe,
  Calendar,
  Tag,
  HardDrive,
  ExternalLink,
  Volume2,
  Play,
  Pause,
  Sliders,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Constants & Category Configuration ───
const CATEGORIES = [
  { key: 'LOGOS', label: 'LOGOS', icon: Folder, color: '#7C3AED' },
  { key: 'TEAM IMAGES', label: 'TEAM IMAGES', icon: ImageIcon, color: '#3B82F6' },
  { key: 'PLAYER IMAGES', label: 'PLAYER IMAGES', icon: ImageIcon, color: '#10B981' },
  { key: 'SPONSORS', label: 'SPONSORS', icon: Layers, color: '#F59E0B' },
  { key: 'BACKGROUND VIDEOS', label: 'BACKGROUND VIDEOS', icon: Video, color: '#EF4444' },
  { key: 'AUDIO', label: 'AUDIO', icon: Music, color: '#EC4899' },
  { key: 'FONTS', label: 'FONTS', icon: Type, color: '#06B6D4' },
  { key: 'SVG/LOTTIE', label: 'SVG / LOTTIE', icon: Layers, color: '#8B5CF6' }
];

// Formatting Helper for File Sizes
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Auto-detect category based on filename and type
const detectCategory = (file) => {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type.startsWith('image/')) {
    if (name.includes('logo')) return 'LOGOS';
    if (name.includes('sponsor')) return 'SPONSORS';
    if (name.includes('player') || name.includes('photo') || name.includes('avatar') || name.includes('member')) return 'PLAYER IMAGES';
    if (name.includes('team') || name.includes('banner') || name.includes('roster')) return 'TEAM IMAGES';
    return 'LOGOS'; // default image category
  }
  if (type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov') || name.endsWith('.mkv')) {
    return 'BACKGROUND VIDEOS';
  }
  if (type.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.aac')) {
    return 'AUDIO';
  }
  if (name.endsWith('.ttf') || name.endsWith('.otf') || name.endsWith('.woff') || name.endsWith('.woff2')) {
    return 'FONTS';
  }
  if (name.endsWith('.svg') || name.endsWith('.json') || name.endsWith('.lottie')) {
    return 'SVG/LOTTIE';
  }
  return 'LOGOS';
};

// Initial Mock Assets for Premium Studio look
const INITIAL_ASSETS = [
  {
    id: 'asset-1',
    name: 'nexplay_logo_primary_white.png',
    category: 'LOGOS',
    size: 1048576 * 1.45,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    type: 'image/png',
    dimensions: '1000 x 1000',
    date: '2026-07-20T10:30:00Z',
    tags: ['tournament', 'logo', 'branding'],
    usedIn: ['Starting Soon Screen', 'Lobby Screen Overlay', 'Post-Match Leaderboard']
  },
  {
    id: 'asset-2',
    name: 'team_aurora_championship_banner.jpg',
    category: 'TEAM IMAGES',
    size: 1048576 * 2.84,
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    type: 'image/jpeg',
    dimensions: '1920 x 1080',
    date: '2026-07-19T14:45:00Z',
    tags: ['team-aurora', 'banner', 'winner'],
    usedIn: ['Team Matchup Intro', 'Team Spotlight Banner']
  },
  {
    id: 'asset-3',
    name: 'caster_esports_shroud.png',
    category: 'PLAYER IMAGES',
    size: 1048576 * 0.92,
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=80',
    type: 'image/png',
    dimensions: '800 x 1000',
    date: '2026-07-18T09:15:00Z',
    tags: ['caster', 'shroud', 'profile'],
    usedIn: ['Casters Overlay Screen']
  },
  {
    id: 'asset-4',
    name: 'sponsor_beast_energy_glow.png',
    category: 'SPONSORS',
    size: 1048576 * 0.48,
    url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=80',
    type: 'image/png',
    dimensions: '600 x 200',
    date: '2026-07-21T08:00:00Z',
    tags: ['sponsor', 'beast-energy', 'logo-dark'],
    usedIn: ['Lobby Screen Overlay', 'Caster Desktop Frame', 'Kill Feed Mini Sponsor']
  },
  {
    id: 'asset-5',
    name: 'cyberpunk_neon_tunnel_loop.mp4',
    category: 'BACKGROUND VIDEOS',
    size: 1048576 * 24.50,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-tunnel-41870-large.mp4',
    type: 'video/mp4',
    dimensions: '1920 x 1080',
    date: '2026-07-15T18:22:00Z',
    tags: ['loop', 'neon', 'cyberpunk', 'background'],
    usedIn: ['Countdown Screen', 'Break Screen Overlay']
  },
  {
    id: 'asset-6',
    name: 'orchestral_hype_theme.mp3',
    category: 'AUDIO',
    size: 1048576 * 5.25,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'audio/mp3',
    dimensions: 'N/A',
    date: '2026-07-14T11:05:00Z',
    tags: ['audio', 'hype', 'intro', 'music'],
    usedIn: ['Countdown Screen', 'Starting Soon Screen']
  },
  {
    id: 'asset-7',
    name: 'orbitron_condensed_heavy.woff2',
    category: 'FONTS',
    size: 1024 * 84,
    url: '',
    type: 'font/woff2',
    dimensions: 'N/A',
    date: '2026-07-10T12:00:00Z',
    tags: ['font', 'orbitron', 'heading'],
    usedIn: ['All Screen Headings', 'Match Scoreboard numbers']
  },
  {
    id: 'asset-8',
    name: 'apex_sparkle_lottie.json',
    category: 'SVG/LOTTIE',
    size: 1024 * 128,
    url: '',
    type: 'application/json',
    dimensions: 'N/A',
    date: '2026-07-17T16:40:00Z',
    tags: ['lottie', 'sparkle', 'transition'],
    usedIn: ['Screen Transition Effect', 'Winner Announcement Gfx']
  }
];

export default function AssetManager({ data, refresh, overlayApi }) {
  // Asset state initialized with custom samples
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('DATE_DESC'); // DATE_DESC, DATE_ASC, NAME_ASC, NAME_DESC, SIZE_DESC, SIZE_ASC
  const [previewAsset, setPreviewAsset] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Audio Playback Preview State in Modal
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Font Sample Text State in Modal
  const [fontSampleText, setFontSampleText] = useState('NEXPLAY CHAMPIONSHIP SERIES 2026');
  const [fontSize, setFontSize] = useState(24);

  // New Tag input inside modal
  const [newTagInput, setNewTagInput] = useState('');

  // file ref for fallback upload click
  const fileInputRef = useRef(null);

  // Category change within detail modal
  const handleAssetCategoryChange = (assetId, newCategory) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, category: newCategory } : a));
    // Also update current preview asset to reflect live
    if (previewAsset && previewAsset.id === assetId) {
      setPreviewAsset(prev => ({ ...prev, category: newCategory }));
    }
    toast.success('Asset category updated!');
  };

  // Add Tag within detail modal
  const handleAddTag = (assetId, tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        if (a.tags.includes(trimmed)) {
          toast.error('Tag already exists');
          return a;
        }
        const updatedTags = [...a.tags, trimmed];
        toast.success(`Tag "${trimmed}" added!`);
        return { ...a, tags: updatedTags };
      }
      return a;
    }));

    // update modal view state
    if (previewAsset && previewAsset.id === assetId) {
      setPreviewAsset(prev => {
        if (prev.tags.includes(trimmed)) return prev;
        return { ...prev, tags: [...prev.tags, trimmed] };
      });
    }
    setNewTagInput('');
  };

  // Remove Tag within detail modal
  const handleRemoveTag = (assetId, tagToRemove) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const updatedTags = a.tags.filter(t => t !== tagToRemove);
        toast.success('Tag removed');
        return { ...a, tags: updatedTags };
      }
      return a;
    }));

    // update modal view state
    if (previewAsset && previewAsset.id === assetId) {
      setPreviewAsset(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tagToRemove)
      }));
    }
  };

  // Delete asset handler
  const handleDeleteAsset = (assetId, name) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    if (previewAsset && previewAsset.id === assetId) {
      setPreviewAsset(null);
    }
    toast.success(`Deleted asset: ${name}`);
  };

  // Drag-and-drop file upload handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // File Upload Simulator
  const handleFiles = (files) => {
    const newUploads = Array.from(files).map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      file: file
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    newUploads.forEach(upload => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        // Mock progress speed increments
        currentProgress += Math.floor(Math.random() * 15) + 12;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);

          // Build preview URL
          const objectUrl = URL.createObjectURL(upload.file);
          const detectedCat = detectCategory(upload.file);

          const newAsset = {
            id: `asset-${Date.now()}-${Math.random()}`,
            name: upload.file.name,
            category: detectedCat,
            size: upload.file.size,
            url: objectUrl,
            type: upload.file.type || 'application/octet-stream',
            dimensions: detectedCat.includes('IMAGE') || detectedCat === 'LOGOS' || detectedCat === 'SPONSORS' ? '1920 x 1080' : 'N/A',
            date: new Date().toISOString(),
            tags: ['uploaded', 'local'],
            usedIn: ['Custom Overlay Screen']
          };

          setAssets(prev => [newAsset, ...prev]);
          setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          toast.success(`${upload.name} uploaded successfully!`);
        } else {
          setUploadingFiles(prev =>
            prev.map(u => u.id === upload.id ? { ...u, progress: currentProgress } : u)
          );
        }
      }, 180 + Math.random() * 120);
    });
  };

  // Category counts computed dynamically
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(c => {
      counts[c.key] = assets.filter(a => a.category === c.key).length;
    });
    counts['ALL'] = assets.length;
    return counts;
  }, [assets]);

  // Dynamic tags cloud computed from active assets
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    assets.forEach(a => a.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [assets]);

  // Copy URL action helper
  const handleCopyUrl = (url, name) => {
    const dummyUrl = url || `https://cdn.nexplay.studio/assets/${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(dummyUrl);
    toast.success('Asset URL copied to clipboard!');
  };

  // Filter & Sort core logic
  const filteredAndSortedAssets = useMemo(() => {
    let result = [...assets];

    // 1. Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(a => a.category === selectedCategory);
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // 3. Multi-tags selector filter
    if (selectedTags.length > 0) {
      result = result.filter(a =>
        selectedTags.every(t => a.tags.includes(t))
      );
    }

    // 4. Sort logic
    result.sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'DATE_DESC':
          return new Date(b.date) - new Date(a.date);
        case 'DATE_ASC':
          return new Date(a.date) - new Date(b.date);
        case 'SIZE_DESC':
          return b.size - a.size;
        case 'SIZE_ASC':
          return a.size - b.size;
        default:
          return 0;
      }
    });

    return result;
  }, [assets, selectedCategory, searchQuery, selectedTags, sortBy]);

  // Toggle dynamic tag filters
  const toggleTagFilter = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Reset audio playback on modal change
  useEffect(() => {
    if (!previewAsset) {
      setAudioPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [previewAsset]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setAudioPlaying(true);
        }).catch(err => {
          toast.error('Could not play audio preview');
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#04060E] text-white font-rajdhani p-6 selection:bg-[#7C3AED]/30">
      {/* ─── Header Section ─── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute h-2 w-2 rounded-full bg-purple-500 animate-ping" />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            </span>
            <h1 className="font-orbitron text-lg md:text-xl font-black tracking-wider uppercase text-white">
              BROADCAST MEDIA LIBRARY
            </h1>
            <span className="rounded bg-purple-900/40 border border-purple-500/20 px-2 py-0.5 font-orbitron text-[9px] font-bold text-purple-300 tracking-wider">
              NEXPLAY STUDIO v2.6
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium tracking-wide mt-1">
            Manage overlays, soundscapes, dynamic fonts, partner logo rosters, and broadcast assets.
          </p>
        </div>

        {/* Global Storage Stats */}
        <div className="flex items-center gap-4 bg-[#131127] border border-white/5 rounded-xl px-4 py-2.5">
          <HardDrive className="h-5 w-5 text-purple-400" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">STUDIO STORAGE</p>
            <p className="font-teko text-lg text-white font-medium leading-none mt-0.5">
              {formatBytes(assets.reduce((sum, a) => sum + a.size, 0))} / 10 GB
            </p>
          </div>
        </div>
      </div>

      {/* ─── Workspace Layout Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ─── Left Panel: Categories & Tags Sidebar ─── */}
        <div className="space-y-6">
          
          {/* Categories list */}
          <div className="rounded-xl border border-white/5 bg-[#131127] p-4">
            <h2 className="font-orbitron text-[10px] font-black tracking-widest text-purple-400 uppercase mb-3 pb-1 border-b border-white/5">
              ASSET CATEGORIES
            </h2>
            <div className="space-y-1">
              {/* "ALL" Row */}
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className={`h-4 w-4 ${selectedCategory === 'ALL' ? 'text-[#7C3AED]' : 'text-gray-500'}`} />
                  <span className="font-orbitron tracking-wide">ALL MEDIA</span>
                </div>
                <span className="font-teko text-sm bg-black/30 border border-white/5 rounded px-2 text-gray-300">
                  {categoryCounts['ALL']}
                </span>
              </button>

              {/* Individual Categories */}
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isActive ? cat.color : '#6b7280' }}
                      />
                      <span className="font-orbitron tracking-wide">{cat.label}</span>
                    </div>
                    <span className="font-teko text-sm bg-black/30 border border-white/5 rounded px-2 text-gray-300">
                      {categoryCounts[cat.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Tag Filters Cloud */}
          <div className="rounded-xl border border-white/5 bg-[#131127] p-4">
            <h2 className="font-orbitron text-[10px] font-black tracking-widest text-purple-400 uppercase mb-3 pb-1 border-b border-white/5 flex justify-between items-center">
              <span>FILTER BY TAG</span>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="font-orbitron text-[8px] text-red-400 hover:underline hover:text-red-300 uppercase tracking-wider"
                >
                  CLEAR
                </button>
              )}
            </h2>
            {allTags.length === 0 ? (
              <p className="text-[10px] text-gray-500 italic">No tags registered.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {allTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white border border-[#7C3AED]'
                          : 'bg-black/30 text-gray-400 border border-white/5 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span>#{tag}</span>
                      {isSelected && <X className="h-2.5 w-2.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Asset Dashboard & Grid ─── */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
              isDragActive
                ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                : 'border-white/10 bg-[#131127] hover:border-white/20'
            }`}
          >
            {/* Visual gradient light beam sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent -translate-x-full animate-[nx-sweep_3s_infinite]" />

            <div className="flex flex-col items-center justify-center gap-2.5 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                  DRAG & DROP BROADCAST MEDIA
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Supports Images (PNG, JPG, WebP), Videos (MP4, WEBM), Audio (MP3, WAV), Fonts (TTF, WOFF2), Lottie (JSON)
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-1.5 font-orbitron text-[10px] font-black tracking-widest text-white transition-all uppercase"
              >
                SELECT FILES
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Active Uploading Simulators Progress Section */}
          {uploadingFiles.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-[#131127] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                <span className="font-orbitron text-[9px] font-black tracking-widest text-purple-400 uppercase">
                  UPLOADING BROADCAST FILES ({uploadingFiles.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uploadingFiles.map(file => (
                  <div key={file.id} className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-xs font-bold text-gray-200 truncate pr-4">{file.name}</span>
                      <span className="font-mono text-[10px] text-gray-400 shrink-0">{formatBytes(file.size)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] h-full rounded-full transition-all duration-150"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="font-teko text-xs text-[#7C3AED] font-bold w-6 text-right shrink-0">{file.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Search, Filters & Sorters Panel ─── */}
          <div className="flex flex-col md:flex-row items-center gap-3 bg-[#131127] border border-white/5 rounded-xl p-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search file names or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-black/40 py-2 pl-9 pr-4 font-rajdhani text-xs text-white focus:border-[#7C3AED]/40 focus:outline-none transition-all placeholder:text-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              <span className="text-[10px] font-black text-gray-500 tracking-wider font-orbitron shrink-0">SORT BY</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-orbitron text-[10px] font-bold text-gray-300 outline-none focus:border-[#7C3AED]/40 cursor-pointer"
              >
                <option value="DATE_DESC">NEWEST UPLOAD</option>
                <option value="DATE_ASC">OLDEST UPLOAD</option>
                <option value="NAME_ASC">NAME (A-Z)</option>
                <option value="NAME_DESC">NAME (Z-A)</option>
                <option value="SIZE_DESC">SIZE (LARGE - SMALL)</option>
                <option value="SIZE_ASC">SIZE (SMALL - LARGE)</option>
              </select>
            </div>
          </div>

          {/* ─── Assets Grid ─── */}
          {filteredAndSortedAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-white/5 bg-[#131127] text-center min-h-[350px]">
              <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-gray-500 animate-pulse" />
              </div>
              <h3 className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
                NO ASSETS ENCOUNTERED
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 max-w-sm leading-relaxed">
                Refine your filters, clear search terms, or drag some fresh broadcast elements into the upload terminal above.
              </p>
              {(selectedCategory !== 'ALL' || searchQuery !== '' || selectedTags.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                    setSelectedTags([]);
                  }}
                  className="mt-4 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/25 px-4 py-1.5 font-orbitron text-[9px] font-black text-purple-400 tracking-widest uppercase transition-all"
                >
                  RESET FILTERS
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAndSortedAssets.map(asset => {
                const catInfo = CATEGORIES.find(c => c.key === asset.category) || { color: '#7C3AED' };
                const Icon = catInfo.icon || Folder;
                const isImage = asset.category.includes('IMAGE') || asset.category === 'LOGOS' || asset.category === 'SPONSORS';

                return (
                  <div
                    key={asset.id}
                    className="group relative rounded-xl border border-white/5 bg-[#131127] overflow-hidden transition-all duration-200 hover:border-[#7C3AED]/40 hover:shadow-[0_4px_20px_rgba(124,58,237,0.15)] flex flex-col h-full"
                  >
                    {/* Media Thumbnail Container */}
                    <div className="aspect-video w-full bg-black/60 relative overflow-hidden flex items-center justify-center select-none border-b border-white/5 shrink-0">
                      {isImage && asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : asset.category === 'BACKGROUND VIDEOS' && asset.url ? (
                        <div className="w-full h-full relative">
                          {/* We don't auto-load video previews to avoid excessive downloads on lists, but hover plays overlay */}
                          <div className="absolute inset-0 bg-[#0E0B20]/40 flex items-center justify-center group-hover:bg-[#0E0B20]/10 transition-all">
                            <Video className="h-8 w-8 text-red-500/70 drop-shadow-lg" />
                          </div>
                          <video
                            src={asset.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                          />
                        </div>
                      ) : (
                        /* Styled abstract placeholder icon for audio/fonts/json */
                        <div className="relative flex flex-col items-center justify-center p-4">
                          <div
                            className="h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-200"
                            style={{
                              borderColor: `${catInfo.color}33`,
                              background: `radial-gradient(circle, ${catInfo.color}15 0%, transparent 80%)`,
                              boxShadow: `inset 0 0 10px ${catInfo.color}08`
                            }}
                          >
                            <Icon className="h-5 w-5" style={{ color: catInfo.color }} />
                          </div>
                          <span className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest mt-2">
                            {asset.category}
                          </span>
                        </div>
                      )}

                      {/* Quick Category Tag Overlay */}
                      <span
                        className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-orbitron font-black text-white uppercase tracking-wider shadow-md border"
                        style={{
                          backgroundColor: `${catInfo.color}30`,
                          borderColor: `${catInfo.color}40`
                        }}
                      >
                        {asset.category}
                      </span>

                      {/* HOVER QUICK ACTION OVERLAYS */}
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewAsset(asset)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg transition-all"
                          title="Open Details & Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(asset.url, asset.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#131127] border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all"
                          title="Copy CDN URL"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {asset.url && (
                          <a
                            href={asset.url}
                            download={asset.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#131127] border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all"
                            title="Download File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteAsset(asset.id, asset.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-red-400 hover:text-white transition-all"
                          title="Delete Asset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata card footer */}
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <p
                          className="text-xs font-bold text-gray-200 truncate font-orbitron tracking-wide"
                          title={asset.name}
                        >
                          {asset.name}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="font-teko text-xs text-purple-400 font-bold tracking-wider">
                            {formatBytes(asset.size)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gray-600" />
                          <span className="font-teko text-[11px] text-gray-400">
                            {asset.dimensions !== 'N/A' ? asset.dimensions : 'RAW FORMAT'}
                          </span>
                        </div>
                      </div>

                      {/* Tags inside card */}
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {asset.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-[9px] font-bold text-gray-500 uppercase bg-black/20 border border-white/5 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {asset.tags.length > 3 && (
                            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/10 px-1 py-0.5 rounded">
                              +{asset.tags.length - 3} MORE
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Asset Details & Interactive Preview Modal ─── */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-4xl bg-[#131127] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-12 max-h-[90vh]">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setPreviewAsset(null)}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 hover:bg-black/80 border border-white/15 hover:border-white/30 text-gray-300 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column (Span 7): Large preview element */}
            <div className="md:col-span-7 bg-[#04060E] p-6 flex flex-col justify-center items-center relative border-b md:border-b-0 md:border-r border-white/5 min-h-[300px] overflow-y-auto">
              
              {/* Image Previewer */}
              {(previewAsset.category.includes('IMAGE') || previewAsset.category === 'LOGOS' || previewAsset.category === 'SPONSORS') && previewAsset.url ? (
                <div className="w-full h-full flex items-center justify-center max-h-[350px]">
                  <img
                    src={previewAsset.url}
                    alt={previewAsset.name}
                    className="max-h-[320px] max-w-full object-contain rounded-lg border border-white/5 shadow-inner"
                  />
                </div>
              ) : previewAsset.category === 'BACKGROUND VIDEOS' && previewAsset.url ? (
                /* Video Previewer */
                <div className="w-full flex flex-col gap-2">
                  <video
                    src={previewAsset.url}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full max-h-[280px] object-contain rounded-lg border border-white/5 bg-black"
                  />
                  <p className="text-[10px] text-gray-500 text-center font-mono">
                    Resolves live looping. Right-click player to inspect telemetry.
                  </p>
                </div>
              ) : previewAsset.category === 'AUDIO' ? (
                /* Audio Previewer with Bouncing Wave animations */
                <div className="w-full flex flex-col items-center justify-center py-6">
                  {/* Music Visualizer Waves Mock */}
                  <div className="flex items-end justify-center gap-1.5 h-16 mb-6">
                    {[3, 6, 4, 8, 5, 9, 3, 7, 5, 8, 4, 9, 3, 6, 4, 7].map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#EC4899] rounded-full transition-all duration-150"
                        style={{
                          height: audioPlaying ? `${height * 10}%` : '15%',
                          animation: audioPlaying ? `nx-float ${1.2 + (i % 3) * 0.3}s ease-in-out infinite` : 'none',
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>

                  <audio
                    ref={audioRef}
                    src={previewAsset.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                    className="hidden"
                  />

                  <button
                    onClick={toggleAudio}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EC4899] hover:bg-[#D01C76] text-white shadow-lg transition-all"
                  >
                    {audioPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
                  </button>

                  <span className="font-orbitron text-[10px] font-black text-[#EC4899] tracking-widest mt-4">
                    {audioPlaying ? 'PREVIEW AUDIO BROADCAST ACTIVE' : 'PREVIEW AUDIO SOURCE'}
                  </span>
                </div>
              ) : previewAsset.category === 'FONTS' ? (
                /* Font Previewer with dynamic typography text area and sizing */
                <div className="w-full space-y-4">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-center min-h-[140px]">
                    <p
                      style={{ fontSize: `${fontSize}px` }}
                      className="text-center font-bold text-white tracking-wide break-words outline-none"
                    >
                      {fontSampleText}
                    </p>
                  </div>
                  <div className="space-y-3 bg-[#131127] border border-white/5 p-4 rounded-xl">
                    <div>
                      <label className="flex justify-between font-orbitron text-[8px] font-black tracking-widest text-gray-400 mb-1">
                        <span>PREVIEW SIZE</span>
                        <span className="text-cyan-400">{fontSize}PX</span>
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="64"
                        value={fontSize}
                        onChange={e => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 bg-black/40 h-1.5 rounded-lg appearance-none outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block font-orbitron text-[8px] font-black tracking-widest text-gray-400 mb-1">
                        EDIT PREVIEW TEXT
                      </label>
                      <input
                        type="text"
                        value={fontSampleText}
                        onChange={e => setFontSampleText(e.target.value)}
                        className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-rajdhani text-xs text-white focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SVG / JSON / Lottie Code Previewer */
                <div className="w-full space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-2 mx-auto">
                    <Layers className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <p className="font-orbitron text-center text-xs text-white font-bold tracking-widest uppercase">
                    SVG / ANIMATION BLUEPRINT PREVIEW
                  </p>
                  
                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-green-400 h-[140px] overflow-y-auto space-y-1">
                    <p className="text-gray-500">{`{/* Animation Manifest */}`}</p>
                    <p>{`"v": "5.7.4",`}</p>
                    <p>{`"fr": 60,`}</p>
                    <p>{`"ip": 0, "op": 120,`}</p>
                    <p>{`"w": 1920, "h": 1080,`}</p>
                    <p>{`"nm": "BroadCast_LowerThird_Apex",`}</p>
                    <p className="text-purple-400">{`"layers": [ {"ind": 1, "ty": 4, "nm": "GlitchBar", ...} ]`}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Span 5): Details & adjustments */}
            <div className="md:col-span-5 p-6 flex flex-col justify-between overflow-y-auto max-h-[90vh]">
              <div className="space-y-5">
                {/* Filename heading */}
                <div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest font-orbitron text-purple-400 uppercase">
                    <FileText className="h-3 w-3" />
                    <span>ASSET METADATA</span>
                  </div>
                  <h3 className="font-orbitron text-sm font-black text-white truncate break-all mt-1 pr-6" title={previewAsset.name}>
                    {previewAsset.name}
                  </h3>
                </div>

                {/* Info Metadata Block */}
                <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <p className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">FILE SIZE</p>
                      <p className="font-teko text-[17px] text-white font-medium leading-none mt-1">{formatBytes(previewAsset.size)}</p>
                    </div>
                    <div>
                      <p className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">DIMENSIONS</p>
                      <p className="font-teko text-[17px] text-white font-medium leading-none mt-1">{previewAsset.dimensions || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">DATE INGESTED</p>
                      <p className="font-teko text-[17px] text-white font-medium leading-none mt-1">
                        {new Date(previewAsset.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase">MIME TYPE</p>
                      <p className="font-teko text-[17px] text-white font-medium leading-none mt-1 truncate max-w-[120px]" title={previewAsset.type}>
                        {previewAsset.type.toUpperCase() || 'BINARY'}
                      </p>
                    </div>
                  </div>

                  {/* Category Adjust Dropdown */}
                  <div className="border-t border-white/5 pt-3">
                    <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase mb-1.5">
                      REASSIGN BROADCAST CATEGORY
                    </label>
                    <select
                      value={previewAsset.category}
                      onChange={e => handleAssetCategoryChange(previewAsset.id, e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-orbitron text-[10px] font-bold text-gray-300 outline-none focus:border-[#7C3AED]/40 cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Editable Tags Management */}
                <div>
                  <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase mb-1.5">
                    ASSET CLOUD TAGS
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2 max-h-[80px] overflow-y-auto pr-1">
                    {previewAsset.tags.length === 0 ? (
                      <span className="text-[10px] text-gray-600 italic">No tags associated</span>
                    ) : (
                      previewAsset.tags.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/30 border border-white/5 text-gray-300 flex items-center gap-1.5"
                        >
                          <span>#{t}</span>
                          <button
                            onClick={() => handleRemoveTag(previewAsset.id, t)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  
                  {/* Add Tag Input field */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add custom tag (press enter)..."
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleAddTag(previewAsset.id, newTagInput);
                        }
                      }}
                      className="flex-1 rounded-lg border border-white/5 bg-black/40 px-3 py-1.5 font-rajdhani text-xs text-white focus:outline-none focus:border-[#7C3AED]/40 placeholder:text-gray-600"
                    />
                    <button
                      onClick={() => handleAddTag(previewAsset.id, newTagInput)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 hover:bg-[#7C3AED] text-purple-400 hover:text-white transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Places Referenced Section */}
                <div>
                  <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest uppercase mb-1.5">
                    BROADCAST REFERENCES
                  </label>
                  <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                    {previewAsset.usedIn && previewAsset.usedIn.length > 0 ? (
                      previewAsset.usedIn.map((place, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 rounded bg-black/10 border border-white/5 text-[11px] text-gray-300 font-bold"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                          <span className="truncate">{place}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-bold flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Not deployed in any active screen templates.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2.5">
                <button
                  onClick={() => handleCopyUrl(previewAsset.url, previewAsset.name)}
                  className="flex-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 font-orbitron text-[10px] font-black tracking-widest text-white transition-all uppercase flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>COPY CDN URL</span>
                </button>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 font-orbitron text-[10px] font-black tracking-widest text-gray-300 hover:text-white transition-all uppercase"
                >
                  DISMISS
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
