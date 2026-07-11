import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from '@/components/ScrollToTop';
import DirectorPanel from './pages/DirectorPanel';
import DataInputer from './pages/DataInputer';
import Overlay from './pages/Overlay';
import PinGate from './components/PinGate';
import { Clapperboard, Keyboard, Monitor, ExternalLink, Zap } from 'lucide-react';

const queryClient = new QueryClient();

function NavBar() {
  const loc = useLocation();
  if (loc.pathname === '/overlay') return null;

  const tabs = [
    { to: '/director', label: 'DIRECTOR',     icon: Clapperboard, desc: 'Scene & overlay command center' },
    { to: '/inputer',  label: 'DATA INPUTER', icon: Keyboard,     desc: 'Live kills, elims & game events' },
  ];
  const active = (to) => loc.pathname === to || (loc.pathname === '/' && to === '/director');

  return (
    <nav className="flex items-center gap-0 border-b border-white/10 bg-[#08080f] px-0 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-r border-white/10 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-700">
          <Zap className="h-4 w-4 text-black" />
        </div>
        <div className="leading-none">
          <p className="font-orbitron text-xs font-black tracking-widest text-orange-500">BOOYAH</p>
          <p className="font-orbitron text-[9px] font-bold tracking-widest text-gray-500">DIRECTOR</p>
        </div>
      </div>

      {/* Role tabs */}
      {tabs.map(({ to, label, icon: Icon, desc }) => (
        <Link key={to} to={to}
          className={`group flex items-center gap-3 border-r border-white/10 px-6 py-3 transition-all ${
            active(to) ? 'bg-orange-500/10 border-b-2 border-b-orange-500' : 'hover:bg-white/5'
          }`}>
          <Icon className={`h-4 w-4 ${active(to) ? 'text-orange-400' : 'text-gray-500'}`} />
          <div>
            <p className={`font-orbitron text-[11px] font-black tracking-wider ${active(to) ? 'text-orange-400' : 'text-gray-400'}`}>{label}</p>
            <p className="text-[9px] text-gray-600 group-hover:text-gray-500">{desc}</p>
          </div>
          {active(to) && <div className="ml-1 h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />}
        </Link>
      ))}

      <div className="ml-auto px-4">
        <a href="/overlay" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-gray-500 hover:border-orange-500/40 hover:text-orange-400 transition-all">
          <Monitor className="h-3.5 w-3.5" />
          OBS Overlay
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <div className="flex h-screen flex-col bg-[#0a0a0f] text-white overflow-hidden">
          <NavBar />
          <div className="flex-1 overflow-hidden min-h-0">
            <Routes>
              <Route path="/" element={
                <PinGate role="director"><DirectorPanel /></PinGate>
              } />
              <Route path="/director" element={
                <PinGate role="director"><DirectorPanel /></PinGate>
              } />
              <Route path="/inputer" element={
                <PinGate role="inputer"><DataInputer /></PinGate>
              } />
              <Route path="/control-panel" element={
                <PinGate role="director"><DirectorPanel /></PinGate>
              } />
              <Route path="/overlay" element={<Overlay />} />
            </Routes>
          </div>
        </div>
      </Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#16161f', color: '#fff', border: '1px solid rgba(249,115,22,0.3)', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' },
        success: { iconTheme: { primary: '#f97316', secondary: '#000' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
    </QueryClientProvider>
  );
}
