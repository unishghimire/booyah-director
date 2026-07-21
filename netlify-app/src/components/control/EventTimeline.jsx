import React, { useState, useMemo } from 'react';
import { Skull, Heart, Zap, Clock, Download, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventTimeline({ killEvents, eliminationEvents, matchEvents, teams }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Merge all events gracefully and sort them newest first
  const mergedEvents = useMemo(() => {
    const safeKills = Array.isArray(killEvents) ? killEvents : [];
    const safeElims = Array.isArray(eliminationEvents) ? eliminationEvents : [];
    const safeMatches = Array.isArray(matchEvents) ? matchEvents : [];

    // Map Kills
    const kills = safeKills.map((e, index) => ({
      ...e,
      id: e.id || `kill-${e.timestamp || e.created_date || ''}-${index}-${Math.random()}`,
      type: 'kill',
      timestamp: e.timestamp || e.created_date || new Date().toISOString()
    }));

    // Map Eliminations/Team Wipes
    const elims = safeElims.map((e, index) => {
      const isRevive = e.is_revive || e.type === 'revive' || String(e.action || '').toLowerCase() === 'revive';
      return {
        ...e,
        id: e.id || `elim-${e.timestamp || e.created_date || ''}-${index}-${Math.random()}`,
        type: 'elimination',
        isRevive,
        timestamp: e.timestamp || e.created_date || new Date().toISOString()
      };
    });

    // Map General Match/Zone Events
    const matches = safeMatches.map((e, index) => {
      const isZone = e.is_zone || 
                     e.type === 'zone' || 
                     e.event_type === 'zone' || 
                     (e.title && String(e.title).toLowerCase().includes('zone')) ||
                     (e.description && String(e.description).toLowerCase().includes('zone')) ||
                     (e.message && String(e.message).toLowerCase().includes('zone'));
      return {
        ...e,
        id: e.id || `match-${e.timestamp || e.created_date || ''}-${index}-${Math.random()}`,
        type: isZone ? 'zone' : 'match',
        timestamp: e.timestamp || e.created_date || new Date().toISOString()
      };
    });

    // Combine and sort (newest first)
    return [...kills, ...elims, ...matches].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [killEvents, eliminationEvents, matchEvents]);

  // Find teams by ID or Name
  const getTeamById = (teamId) => {
    if (!teamId) return null;
    const safeTeams = Array.isArray(teams) ? teams : [];
    return safeTeams.find(t => String(t.id) === String(teamId));
  };

  const getTeamByName = (teamName) => {
    if (!teamName) return null;
    const safeTeams = Array.isArray(teams) ? teams : [];
    return safeTeams.find(t => String(t.name).toLowerCase() === String(teamName).toLowerCase());
  };

  // Filter events based on pill selection & search query
  const filteredEvents = useMemo(() => {
    return mergedEvents.filter(event => {
      // 1. Filter Pills
      if (activeFilter !== 'ALL') {
        if (activeFilter === 'KILLS' && event.type !== 'kill') return false;
        if (activeFilter === 'ELIMINATIONS' && event.type !== 'elimination') return false;
        if (activeFilter === 'ZONES' && event.type !== 'zone') return false;
        if (activeFilter === 'MATCH EVENTS' && event.type !== 'match') return false;
      }

      // 2. Search Box
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          event.killer_name,
          event.killed_player_name,
          event.killer_team_name,
          event.killed_team_name,
          event.player_name,
          event.team_name,
          event.player,
          event.team,
          event.victim_name,
          event.victim_team_name,
          event.description,
          event.title,
          event.message
        ];

        const matchFound = searchableFields.some(field =>
          field && String(field).toLowerCase().includes(query)
        );

        if (!matchFound) return false;
      }

      return true;
    });
  }, [mergedEvents, activeFilter, searchQuery]);

  // Export Events as JSON File
  const handleExport = () => {
    try {
      if (mergedEvents.length === 0) {
        toast.error('No events available to export.');
        return;
      }
      const jsonString = JSON.stringify(mergedEvents, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `nexplay_broadcast_events_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success('Broadcast event log exported successfully!');
    } catch (error) {
      console.error('Error exporting events:', error);
      toast.error('Failed to export event log.');
    }
  };

  // Formatting timestamp into HH:MM:SS
  const formatTime = (ts) => {
    if (!ts) return '00:00:00';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '00:00:00';
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '00:00:00';
    }
  };

  // Team Badge Component
  const TeamBadge = ({ team, fallbackName }) => {
    const name = team ? team.name : fallbackName;
    if (!name) return null;

    const logo = team?.logo_url;
    const teamColor = team?.color || '#3B82F6';

    return (
      <div 
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-orbitron border bg-black/40 border-white/5 transition-all duration-150"
        style={{ borderLeftColor: teamColor, borderLeftWidth: '3px' }}
      >
        {logo && (
          <img 
            src={logo} 
            alt="" 
            className="h-3 w-3 object-contain" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        )}
        <span className="text-white font-black">{name}</span>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#131127] p-5 shadow-2xl text-white font-rajdhani select-none transition-all duration-300">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
          </div>
          <div>
            <h2 className="font-orbitron text-sm font-black tracking-widest text-white uppercase leading-none">
              NEXPLAY BROADCAST LOG
            </h2>
            <p className="font-orbitron text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1">
              REAL-TIME EVENT TIMELINE
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-[#04060E] border border-white/10 hover:border-[#7C3AED] hover:bg-[#7C3AED]/15 px-3.5 py-1.5 rounded-md font-orbitron text-[9px] font-black uppercase tracking-widest text-white transition-all duration-200"
        >
          <Download className="h-3 w-3 text-[#3B82F6]" />
          EXPORT LOG
        </button>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-end">
        {/* Filter Pills */}
        <div className="lg:col-span-8 space-y-1.5">
          <label className="block font-orbitron text-[8px] font-black uppercase tracking-widest text-gray-500">
            FILTER BY TYPE
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'KILLS', 'ELIMINATIONS', 'ZONES', 'MATCH EVENTS'].map(pill => {
              const isActive = activeFilter === pill;
              
              // Count for each type based on merged events
              let count = 0;
              if (pill === 'ALL') count = mergedEvents.length;
              else if (pill === 'KILLS') count = mergedEvents.filter(e => e.type === 'kill').length;
              else if (pill === 'ELIMINATIONS') count = mergedEvents.filter(e => e.type === 'elimination').length;
              else if (pill === 'ZONES') count = mergedEvents.filter(e => e.type === 'zone').length;
              else if (pill === 'MATCH EVENTS') count = mergedEvents.filter(e => e.type === 'match').length;

              return (
                <button
                  key={pill}
                  onClick={() => setActiveFilter(pill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-orbitron text-[9px] font-black uppercase tracking-widest transition-all duration-150 border ${
                    isActive
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20'
                      : 'bg-black/25 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{pill}</span>
                  <span className={`font-teko text-[11px] px-1 rounded-sm ${isActive ? 'bg-white/25 text-white' : 'bg-white/5 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="lg:col-span-4 space-y-1.5">
          <label className="block font-orbitron text-[8px] font-black uppercase tracking-widest text-gray-500">
            SEARCH PLAYERS / TEAMS
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/25 pl-8 pr-8 py-1.5 text-[10px] font-orbitron uppercase tracking-widest text-white placeholder-gray-600 focus:border-[#3B82F6] focus:outline-none transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER SUMMARY */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3.5 pb-2 mb-2 text-[8px] font-orbitron font-black uppercase tracking-widest text-gray-500">
        <div className="flex items-center gap-1.5">
          <span>ACTIVE FILTER:</span>
          <span className="text-[#3B82F6]">{activeFilter}</span>
          {searchQuery && (
            <>
              <span className="text-gray-700">|</span>
              <span>QUERY:</span>
              <span className="text-[#3B82F6]">"{searchQuery}"</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span>MATCHED LOGS:</span>
          <span className="text-[#22c55e] font-teko text-base leading-none">{filteredEvents.length}</span>
        </div>
      </div>

      {/* TIMELINE LIST CONTAINER */}
      <div className="border border-white/5 rounded-lg bg-black/10 p-2">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
              <Clock className="h-8 w-8 text-gray-500 animate-pulse" />
            </div>
            <h3 className="font-orbitron text-xs font-black tracking-widest text-gray-400 uppercase">
              NO EVENTS RECORDED
            </h3>
            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">
              Events will appear here when matches are active
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[600px] pr-1 space-y-1 scroll-smooth">
            {filteredEvents.map((event, idx) => {
              // Styling parameters based on event type
              let dotColor = 'bg-[#7C3AED] shadow-[#7C3AED]/30'; // Purple for event
              let IconComponent = Zap;
              let iconColor = 'text-[#7C3AED]';
              let typeBadgeClass = 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20';

              if (event.type === 'kill') {
                dotColor = 'bg-[#ef4444] shadow-[#ef4444]/30'; // Red for kill
                IconComponent = Skull;
                iconColor = 'text-[#ef4444]';
                typeBadgeClass = 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20';
              } else if (event.type === 'elimination') {
                dotColor = 'bg-[#f59e0b] shadow-[#f59e0b]/30'; // Orange for elimination
                IconComponent = Heart;
                iconColor = 'text-[#f59e0b]';
                typeBadgeClass = 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20';
              } else if (event.type === 'zone') {
                dotColor = 'bg-[#3B82F6] shadow-[#3B82F6]/30'; // Blue for zone
                IconComponent = Zap;
                iconColor = 'text-[#3B82F6]';
                typeBadgeClass = 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
              }

              // Retrieve matching team objects for badge display
              const killerTeam = event.killer_team_id ? getTeamById(event.killer_team_id) : (event.killer_team_name ? getTeamByName(event.killer_team_name) : null);
              const victimTeam = event.killed_team_id ? getTeamById(event.killed_team_id) : (event.killed_team_name ? getTeamByName(event.killed_team_name) : null);
              const team = event.team_id ? getTeamById(event.team_id) : (event.team_name ? getTeamByName(event.team_name) : null);

              // Auto-generate standard tournament/esports descriptions if none provided
              let description = event.description || event.message || event.title || '';
              if (!description) {
                if (event.type === 'kill') {
                  const killer = event.killer_name || 'UNKNOWN PLAYER';
                  const victim = event.killed_player_name || 'UNKNOWN PLAYER';
                  const weaponStr = event.weapon ? ` WITH ${String(event.weapon).toUpperCase()}` : '';
                  description = `${killer} ELIMINATED ${victim}${weaponStr}`;
                } else if (event.type === 'elimination') {
                  const name = event.player_name || event.team_name || 'TEAM';
                  if (event.isRevive) {
                    description = `${name} WAS REVIVED`;
                  } else {
                    description = `${name} WAS ELIMINATED`;
                  }
                } else if (event.type === 'zone') {
                  description = 'SAFE ZONE ACTIVE';
                } else {
                  description = 'MATCH EVENT TRIGGERED';
                }
              }

              return (
                <div 
                  key={event.id} 
                  className="relative flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors duration-150 border border-transparent hover:border-white/5"
                >
                  {/* Vertical Timeline Dot & Line */}
                  <div className="relative flex flex-col items-center self-stretch justify-center w-4">
                    {/* Line stretching down unless it's the last item */}
                    {idx !== filteredEvents.length - 1 && (
                      <div className="absolute top-1/2 bottom-0 w-[1.5px] bg-white/5 translate-y-1" />
                    )}
                    {/* Line stretching up unless it's the first item */}
                    {idx !== 0 && (
                      <div className="absolute top-0 bottom-1/2 w-[1.5px] bg-white/5 -translate-y-1" />
                    )}
                    {/* Glowing colored dot */}
                    <div className={`relative z-10 h-2.5 w-2.5 rounded-full border border-[#131127] shadow-lg ${dotColor}`} />
                  </div>

                  {/* Time Badge (HH:MM:SS) */}
                  <div className="font-teko text-sm text-gray-500 tracking-wider w-14 select-none leading-none">
                    {formatTime(event.timestamp)}
                  </div>

                  {/* Type Icon Container */}
                  <div className={`flex h-6.5 w-6.5 items-center justify-center rounded border bg-black/40 ${typeBadgeClass} flex-shrink-0`}>
                    <IconComponent className={`h-3 w-3 ${iconColor}`} />
                  </div>

                  {/* Event Text & Team Pills */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    {/* Description text */}
                    <span className="font-rajdhani text-[11px] font-black text-gray-200 tracking-wide uppercase leading-none">
                      {description}
                    </span>

                    {/* Team Badges Section */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {event.type === 'kill' ? (
                        <>
                          {killerTeam && <TeamBadge team={killerTeam} />}
                          {killerTeam && victimTeam && (
                            <span className="text-[8px] font-black tracking-widest text-gray-600 font-orbitron uppercase">VS</span>
                          )}
                          {victimTeam && <TeamBadge team={victimTeam} />}
                          {!killerTeam && event.killer_team_name && <TeamBadge fallbackName={event.killer_team_name} />}
                          {!killerTeam && !victimTeam && event.killed_team_name && <TeamBadge fallbackName={event.killed_team_name} />}
                        </>
                      ) : (
                        <>
                          {team && <TeamBadge team={team} />}
                          {!team && event.team_name && <TeamBadge fallbackName={event.team_name} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
