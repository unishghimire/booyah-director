import React, { useState, useEffect } from 'react';
import { useOverlayData } from '@/lib/overlayApi';
import SetupBlank from '@/components/overlay/SetupBlank';
import PreMatchMap from '@/components/overlay/PreMatchMap';
import Scoreboard from '@/components/overlay/Scoreboard';
import KillFeedScreen from '@/components/overlay/KillFeedScreen';
import EliminationAlert from '@/components/overlay/EliminationAlert';
import MvpScreen from '@/components/overlay/MvpScreen';
import Champions from '@/components/overlay/Champions';

export default function Overlay() {
  const { data } = useOverlayData();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';
  const tournament = data?.tournament || null;
  const currentMatch = data?.current_match || data?.match || null;
  const overlayState = data?.overlay_state || {};
  const teams = data?.teams || [];
  const players = data?.players || [];
  const killFeed = data?.kill_feed || [];
  const eliminations = data?.eliminations || [];

  const renderScreen = () => {
    switch (screen) {
      case 'setup_blank':
        return <SetupBlank />;
      case 'pre_match_map':
        return <PreMatchMap tournament={tournament} currentMatch={currentMatch} teams={teams} players={players} />;
      case 'scoreboard':
        return <Scoreboard tournament={tournament} currentMatch={currentMatch} teams={teams} players={players} killFeed={killFeed} />;
      case 'kill_feed':
        return <KillFeedScreen killFeed={killFeed} />;
      case 'elimination_alert':
        return <EliminationAlert eliminations={eliminations} />;
      case 'mvp':
        return <MvpScreen overlayState={overlayState} />;
      case 'champions':
        return <Champions overlayState={overlayState} teams={teams} />;
      default:
        return <SetupBlank />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050508]" style={{ scrollbarWidth: 'none' }}>
      <style>{`
        ::-webkit-scrollbar { display: none; }
        body { overflow: hidden; margin: 0; }
      `}</style>
      <div
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {renderScreen()}
      </div>
    </div>
  );
}