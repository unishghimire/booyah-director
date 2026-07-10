import React, { useCallback } from 'react';
import { useOverlayData } from '@/lib/overlayApi';
import TournamentSetup from '@/components/control/TournamentSetup';
import TeamRoster from '@/components/control/TeamRoster';
import MatchControls from '@/components/control/MatchControls';
import KillPanel from '@/components/control/KillPanel';
import StandingsTable from '@/components/control/StandingsTable';
import ScreenSwitcher from '@/components/control/ScreenSwitcher';
import MVPCard from '@/components/control/MVPCard';
import ChampionsCard from '@/components/control/ChampionsCard';
import KillFeedLog from '@/components/control/KillFeedLog';
import { Wifi, Trophy, Gamepad2 } from 'lucide-react';

export default function ControlPanel() {
  const { data, loading, refresh } = useOverlayData();

  const tournament = data?.tournament || null;
  const currentMatch = data?.current_match || data?.match || null;
  const overlayState = data?.overlay_state || {};
  const teams = data?.teams || [];
  const players = data?.players || [];
  const killFeed = data?.kill_feed || [];
  const eliminations = data?.eliminations || [];
  const standings = data?.standings || [];

  const onAction = useCallback(() => { refresh(); }, [refresh]);

  if (loading || !data) {
    return (
      <div className="flex h-[calc(100vh-50px)] items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
          <p className="mt-3 font-rajdhani text-sm text-gray-500">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  const hasTournament = !!(tournament || overlayState.tournament_id || teams.length > 0);
  const matchState = currentMatch?.state || 'idle';
  const matchNumber = currentMatch?.match_number || tournament?.current_match_number || 0;

  return (
    <div className="flex h-[calc(100vh-50px)] flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0d0d14] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-orange-500" />
          <div>
            <h1 className="font-orbitron text-sm font-bold text-white">
              {tournament?.name || 'No Tournament Active'}
            </h1>
            <p className="text-[10px] text-gray-500">Free Fire Tournament Director</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Match</span>
            <span className="rounded bg-white/5 px-2 py-0.5 font-orbitron text-xs font-bold text-white">#{matchNumber}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              matchState === 'in_game' ? 'bg-green-500/20 text-green-400' :
              matchState === 'post_match' ? 'bg-orange-500/20 text-orange-400' :
              matchState === 'mvp' ? 'bg-purple-500/20 text-purple-400' :
              matchState === 'pre_match' ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/5 text-gray-500'
            }`}>{matchState}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400">
              <Wifi className="h-3 w-3" /> Overlay Active
            </span>
          </div>
        </div>
      </header>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[300px] flex-shrink-0 overflow-y-auto border-r border-white/10 bg-[#0d0d14] p-3">
          {hasTournament ? (
            <TeamRoster tournament={tournament} teams={teams} players={players} onAction={onAction} />
          ) : (
            <TournamentSetup onCreated={onAction} />
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {hasTournament ? (
              <>
                <MatchControls tournament={tournament} currentMatch={currentMatch} onAction={onAction} />
                <KillPanel teams={teams} players={players} onAction={onAction} />
                <StandingsTable teams={teams} players={players} standings={standings} />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Gamepad2 className="mb-3 h-12 w-12 text-gray-700" />
                <h2 className="font-orbitron text-lg font-bold text-gray-400">Create a Tournament to Begin</h2>
                <p className="mt-1 text-sm text-gray-600">Set up your tournament from the panel on the left.</p>
              </div>
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="w-[280px] flex-shrink-0 overflow-y-auto border-l border-white/10 bg-[#0d0d14] p-3">
          <div className="space-y-3">
            <ScreenSwitcher overlayState={overlayState} onAction={onAction} />
            <MVPCard currentMatch={currentMatch} overlayState={overlayState} onAction={onAction} />
            <ChampionsCard teams={teams} onAction={onAction} />
            <KillFeedLog killFeed={killFeed} />

            {/* OBS Setup instructions */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <h4 className="mb-2 font-orbitron text-xs font-bold text-orange-500">OBS SETUP</h4>
              <ol className="space-y-1 text-[11px] text-gray-400">
                <li>1. Add Browser Source in OBS</li>
                <li>2. URL: <span className="break-all text-orange-400">https://kaelo-cec2b53f.base44.app/overlay</span></li>
                <li>3. Width: <span className="text-white">1920</span></li>
                <li>4. Height: <span className="text-white">1080</span></li>
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}