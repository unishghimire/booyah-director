import React, { useState, useEffect, useRef } from 'react';
import { useObsStore } from '@/lib/obsStore';
import { obsService } from '@/lib/obsWebSocket';
import { Settings, Shield, Globe, Power, AlertTriangle, X } from 'lucide-react';

export default function ConnectionStatusBar() {
  const {
    connectionStatus,
    obsAddress,
    obsPassword,
    setObsConfig,
    saveSettings,
    loadSettings,
  } = useObsStore();

  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(obsAddress);
  const [password, setPassword] = useState(obsPassword);
  const [errorMsg, setErrorMsg] = useState('');
  const popoverRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sync internal state when store values load/change
  useEffect(() => {
    setAddress(obsAddress);
    setPassword(obsPassword);
  }, [obsAddress, obsPassword]);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        if (event.target.closest('.obs-status-bar')) return;
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleConnect = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setObsConfig(address, password);
    saveSettings();
    try {
      await obsService.connect(address, password);
    } catch (err) {
      setErrorMsg(err?.message || 'Connection failed');
    }
  };

  const handleDisconnect = async () => {
    setErrorMsg('');
    await obsService.disconnect();
  };

  // Status-specific variables
  let barColor = 'bg-[#ef4444]'; // disconnected/error
  let statusText = 'Disconnected';
  let glowClass = '';

  if (connectionStatus === 'connected') {
    barColor = 'bg-[#22c55e]';
    statusText = 'Connected';
    glowClass = 'shadow-[0_0_10px_#22c55e]';
  } else if (connectionStatus === 'connecting') {
    barColor = 'bg-[#f59e0b] animate-pulse';
    statusText = 'Connecting...';
    glowClass = 'shadow-[0_0_10px_#f59e0b]';
  } else if (connectionStatus === 'error') {
    barColor = 'bg-[#ef4444]';
    statusText = 'Connection Error';
    glowClass = 'shadow-[0_0_10px_#ef4444]';
  }

  return (
    <div className="relative w-full z-[9999] user-select-none">
      {/* The 4px slim bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`obs-status-bar w-full h-1 ${barColor} ${glowClass} cursor-pointer transition-all duration-300 hover:h-2 relative`}
        title={`OBS: ${statusText} (Click to configure)`}
      >
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 bg-white/30 animate-ping" />
        )}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-1/2 -translate-x-1/2 top-2 mt-1 w-[320px] bg-[#0d0b1a] border border-[#7C3AED]/30 rounded-lg p-4 shadow-2xl text-white z-[9999] nx-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#7C3AED]" />
              <h4 className="font-orbitron text-xs font-black tracking-widest text-[#7C3AED]">OBS WEBSOCKET</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connection Status Indicator inside Popover */}
          <div className="flex items-center justify-between bg-black/30 px-3 py-2 rounded mb-4 border border-white/5">
            <span className="text-[10px] font-orbitron font-bold tracking-wider text-white/60">STATUS</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${barColor.split(' ')[0]}`} />
              <span className="font-orbitron text-[11px] font-black tracking-widest">
                {statusText.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-[9px] font-orbitron font-bold tracking-widest text-white/40 mb-1">
                WEB_SOCKET_ADDRESS
              </label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="localhost:4455"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 pl-8 text-xs font-orbitron text-white focus:outline-none focus:border-[#7C3AED]/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-orbitron font-bold tracking-widest text-white/40 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Shield className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 pl-8 text-xs font-orbitron text-white focus:outline-none focus:border-[#7C3AED]/60 transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={connectionStatus === 'connecting'}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#8B5CF6] hover:to-[#60A5FA] text-white py-1.5 rounded text-xs font-orbitron font-black tracking-wider transition-all disabled:opacity-50"
              >
                <Power className="w-3.5 h-3.5" /> CONNECT
              </button>
              {(connectionStatus === 'connected' || connectionStatus === 'error') && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center justify-center bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-xs font-orbitron font-black tracking-wider transition-colors"
                >
                  DISCONNECT
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
