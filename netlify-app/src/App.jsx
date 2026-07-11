import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import AuthPage from '@/pages/AuthPage';
import PricingPage from '@/pages/PricingPage';
import DirectorPanel from './pages/DirectorPanel';
import DataInputer from './pages/DataInputer';
import Overlay from './pages/Overlay';
import PinGate from './components/PinGate';
import { useOverlayData } from '@/lib/overlayApi';
import { Clapperboard, Keyboard, Monitor, ExternalLink, Zap, LogOut } from 'lucide-react';

const queryClient = new QueryClient();

function NavBarContent() {
  const loc = useLocation();
  const { data } = useOverlayData(true);
  const { user, logout } = useAuth();

  if (loc.pathname === '/overlay' || !user) return null;

  const currentScreenName = data?.overlayState?.current_screen 
    ? data.overlayState.current_screen.replace(/_/g, ' ').toUpperCase()
    : 'BLANK';

  const tabs = [
    { to: '/director', label: 'DIRECTOR', icon: Clapperboard, activeBg: 'rgba(255,107,0,0.15)', activeColor: '#FF6B00' },
    { to: '/inputer',  label: 'DATA INPUTER', icon: Keyboard, activeBg: 'rgba(0,212,255,0.15)', activeColor: '#00D4FF' },
  ];

  const active = (to) => loc.pathname === to || (loc.pathname === '/' && to === '/director');

  return (
    <nav className="relative flex items-center justify-between border-b border-white/10 bg-[#060912] px-4 py-2 flex-shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#FF6B00] to-[#FF8C00]">
          <Zap className="h-4.5 w-4.5 text-black stroke-[2.5]" />
        </div>
        <div className="leading-none">
          <p className="font-orbitron text-xs font-black tracking-widest text-[#FF6B00]">BOOYAH</p>
          <p className="font-orbitron text-[9px] font-bold tracking-widest text-white">DIRECTOR</p>
        </div>
      </div>

      {/* Center: Role tabs */}
      <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
        {tabs.map(({ to, label, icon: Icon, activeBg, activeColor }) => {
          const isActive = active(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-4 py-1.5 rounded-[6px] transition-all"
              style={isActive ? { background: activeBg, color: activeColor } : { color: 'rgba(255,255,255,0.4)' }}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? activeColor : 'rgba(255,255,255,0.4)' }} />
              <span className="font-orbitron text-[11px] font-black tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: Status Pill & OBS Link & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[rgba(255,107,0,0.4)] bg-[#09090f] px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B00]"></span>
          </span>
          <span className="font-orbitron text-[9px] font-black text-[#FF6B00] tracking-wider">
            LIVE: {currentScreenName}
          </span>
        </div>

        <a
          href="/overlay"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-1.5 text-[10px] font-orbitron font-black text-[rgba(255,255,255,0.6)] hover:border-[#FF6B00]/40 hover:text-white transition-all"
        >
          <Monitor className="h-3.5 w-3.5" />
          OBS SOURCE
          <ExternalLink className="h-3 w-3" />
        </a>

        <button 
          onClick={logout}
          className="flex items-center gap-1 text-[10px] font-orbitron text-gray-500 hover:text-red-400 transition-colors bg-[#0f0f1a] border border-white/10 px-3 py-1.5 rounded-lg font-black"
        >
          <LogOut className="w-3.5 h-3.5" /> LOGOUT
        </button>
      </div>

      {/* Bottom gradient strip */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#FF6B00] via-transparent to-[#00D4FF]" />
    </nav>
  );
}

function NavBar() {
  return <NavBarContent />;
}

function AppRoutes() {
  const { user, subscription, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#060915]">
      <div className="h-10 w-10 rounded-full border-4 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
    </div>
  );

  // Not logged in
  if (!user) return (
    <Routes>
      <Route path="/overlay" element={<Overlay />} />
      <Route path="*" element={<AuthPage />} />
    </Routes>
  );

  // Check subscription active
  const isSubscribed = subscription?.status === 'active' && subscription?.expiresAt > Date.now();

  // No active subscription
  if (!isSubscribed) return (
    <Routes>
      <Route path="/overlay" element={<Overlay />} />
      <Route path="*" element={<PricingPage />} />
    </Routes>
  );

  // Fully authenticated + subscribed
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/director" replace />} />
      <Route path="/director" element={<PinGate role="director"><DirectorPanel /></PinGate>} />
      <Route path="/inputer" element={<PinGate role="inputer"><DataInputer /></PinGate>} />
      <Route path="/control-panel" element={<Navigate to="/director" replace />} />
      <Route path="/overlay" element={<Overlay />} />
      <Route path="*" element={<Navigate to="/director" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ScrollToTop />
          <div className="flex h-screen flex-col bg-[#09090f] text-white overflow-hidden">
            <NavBar />
            <div className="flex-1 overflow-hidden min-h-0">
              <AppRoutes />
            </div>
          </div>
        </AuthProvider>
      </Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#16161f', color: '#fff', border: '1px solid rgba(249,115,22,0.3)', fontSize: '12px', fontFamily: 'Orbitron, sans-serif', fontWeight: '600' },
        success: { iconTheme: { primary: '#f97316', secondary: '#000' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
    </QueryClientProvider>
  );
}
