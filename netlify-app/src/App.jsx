import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from '@/components/ScrollToTop';
import DirectorPanel from './pages/DirectorPanel';
import DataInputer from './pages/DataInputer';
import Overlay from './pages/Overlay';
import { Clapperboard, Keyboard, Monitor, ExternalLink } from 'lucide-react';

const queryClient = new QueryClient();

function NavBar() {
  const loc = useLocation();
  if (loc.pathname === '/overlay') return null;

  const links = [
    { to: '/director', label: 'Director', icon: Clapperboard, desc: 'Scene & overlay control' },
    { to: '/inputer',  label: 'Data Inputer', icon: Keyboard,    desc: 'Live game data entry' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-4 border-b border-white/10 bg-[#07070f]/95 px-6 py-2.5 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500">
          <span className="font-orbitron text-xs font-black text-black">BD</span>
        </div>
        <div>
          <span className="font-orbitron text-sm font-black tracking-wider text-orange-500">BOOYAH</span>
          <span className="font-orbitron text-sm font-black tracking-wider text-white"> DIRECTOR</span>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-1 flex-1">
        {links.map(({ to, label, icon: Icon, desc }) => {
          const active = loc.pathname === to || (loc.pathname === '/' && to === '/director');
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                active
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {active && <span className="hidden text-[10px] font-medium opacity-70 lg:block">— {desc}</span>}
            </Link>
          );
        })}
      </div>

      {/* OBS link */}
      <a href="/overlay" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-gray-400 hover:border-orange-500/40 hover:text-orange-400 transition-all">
        <Monitor className="h-3.5 w-3.5" />
        OBS Overlay
        <ExternalLink className="h-3 w-3" />
      </a>
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <div className="flex h-screen flex-col bg-[#0a0a0f] text-white">
          <NavBar />
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/"          element={<DirectorPanel />} />
              <Route path="/director"  element={<DirectorPanel />} />
              <Route path="/inputer"   element={<DataInputer />} />
              <Route path="/control-panel" element={<DirectorPanel />} />
              <Route path="/overlay"   element={<Overlay />} />
            </Routes>
          </div>
        </div>
      </Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#18181f', color: '#fff', border: '1px solid rgba(249,115,22,0.3)', fontSize: '13px' },
        success: { iconTheme: { primary: '#f97316', secondary: '#000' } },
      }} />
    </QueryClientProvider>
  );
}
