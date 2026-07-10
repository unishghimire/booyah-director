import { Outlet, Link, useLocation } from 'react-router-dom';
import { Gamepad2, Monitor } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const isControl = location.pathname.startsWith('/control-panel');
  const isOverlay = location.pathname.startsWith('/overlay');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-orange-500/20 bg-[#0a0a0f]/95 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-1.5">
          <span className="font-orbitron text-base font-black tracking-wider text-orange-500 sm:text-xl">BOOYAH</span>
          <span className="font-orbitron text-base font-black tracking-wider text-white sm:text-xl">DIRECTOR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/control-panel"
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isControl ? 'bg-orange-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-4 w-4" /> Control Panel
          </Link>
          <Link
            to="/overlay"
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isOverlay ? 'bg-orange-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Monitor className="h-4 w-4" /> OBS Overlay
          </Link>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}