import React, { useState } from 'react';
import toast from 'react-hot-toast';
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
import DesignStudio from '@/components/control/DesignStudio';
import { Monitor, Copy, Paintbrush, Tv } from 'lucide-react';

function OBSUrlBox() {
  const url = `${window.location.origin}/overlay`;
  const handleCopy = () => {
    navigator.clipboard?.writeText(url);
    toast.success('OBS URL copied!');
  };
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-gray-400">
        <Monitor className="h-3 w-3" />
        <span className="text-xs font-medium uppercase tracking-wide">OBS Browser Source</span>
      </div>
      <div className="flex gap-1">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-gray-400 outline-none"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-bold text-black hover:bg-orange-400"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
    </div>
  );
}

const RIGHT_TABS = [
  { key: 'screens', label: 'Screens', icon: Tv },
  { key: 'design', label: 'Design', icon: Paintbrush },
];

export default function ControlPanel() {
  const { data, loading, refresh } = useOverlayData(true);
  const [rightTab, setRightTab] = useState('screens');

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        <span className="font-orbitron text-sm">Loading tournament data...</span>
      </div>
    );
  }

  const { tournament, overlay_state, teams, players, current_match, kill_feed, standings } = data;

  return (
    <div className="flex h-full">
      {/* ── Left sidebar: Tournament & Teams ── */}
      <aside className="flex w-80 flex-shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#0d0d14] p-3 gap-3">
        {!tournament ? (
          <TournamentSetup onCreated={refresh} />
        ) : (
          <>
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Active Tournament</p>
              <p className="font-orbitron text-sm font-bold text-white">{tournament.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Match {tournament.current_match_number || 0}/{tournament.total_matches} · {tournament.points_per_kill}pt/kill
              </p>
            </div>
            <TeamRoster tournament={tournament} teams={teams} players={players} onAction={refresh} />
          </>
        )}
      </aside>

      {/* ── Main: Match Controls + Kills + Standings ── */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          <MatchControls tournament={tournament} currentMatch={current_match} onAction={refresh} />
          <KillPanel tournament={tournament} teams={teams} players={players} currentMatch={current_match} onAction={refresh} />
          <StandingsTable teams={teams} standings={standings} />
        </div>
      </main>

      {/* ── Right panel: Screens OR Design Studio ── */}
      <aside className="flex w-80 flex-shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#0d0d14] p-3 gap-3">
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-white/10 bg-black/30 p-1 gap-1">
          {RIGHT_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRightTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-bold transition ${
                rightTab === key
                  ? 'bg-orange-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {rightTab === 'screens' ? (
          <>
            <ScreenSwitcher currentScreen={overlay_state?.current_screen} onAction={refresh} />
            <MVPCard tournament={tournament} currentMatch={current_match} overlayState={overlay_state} onAction={refresh} />
            <ChampionsCard tournament={tournament} teams={teams} onAction={refresh} />
            <KillFeedLog killFeed={kill_feed} />
            <OBSUrlBox />
          </>
        ) : (
          <DesignStudio onAction={refresh} />
        )}
      </aside>
    </div>
  );
}
