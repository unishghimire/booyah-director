import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import { ErrorBoundary, PanelBoundary } from '@/components/ErrorBoundary';
import AuthPage from '@/pages/AuthPage';
import PricingPage from '@/pages/PricingPage';
import DirectorPanel from './pages/DirectorPanel';
import DataInputer from './pages/DataInputer';
import Overlay from './pages/Overlay';
import OverlayLinks from './pages/OverlayLinks';
import { useOverlayData } from '@/lib/overlayApi';
import { Clapperboard, Keyboard, Monitor, ExternalLink, Zap, LogOut } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || 'nex.unishghimire@gmail.com,unishghimire2@gmail.com')
  .split(',').map(e => e.trim().toLowerCase());

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function getExpiresAt(subscription) {
  if (!subscription?.expiresAt) return 0;
  const v = subscription.expiresAt;
  if (typeof v === 'number') return v;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

function isOwner(user) {
  return Boolean(user?.email && OWNER_EMAILS.includes(user.email.toLowerCase()));
}

function isSubscribed(user, subscription) {
  if (isOwner(user)) return true;
  return subscription?.status === 'active' && getExpiresAt(subscription) > Date.now();
}

/* ── Navbar ─────────────────────────────────────────────────────────────────── */
function NavBarContent() {
  const loc = useLocation();

  // Overlay routes — never show nav
  if (loc.pathname.startsWith('/overlay')) return null;

  // Wrap in its own boundary so a navbar crash doesn't kill the whole app
  return (
    <PanelBoundary label="NAV">
      <NavBarInner loc={loc} />
    </PanelBoundary>
  );
}

function NavBarInner({ loc }) {
  const { user, subscription, logout } = useAuth();

  // Not logged in — no nav
  if (!user) return null;
  // Not subscribed — no nav
  if (!isSubscribed(user, subscription)) return null;

  // Always call hook at top level (React rules)
  const { data: _navData } = useOverlayData(true);
  const currentScreenName = _navData?.overlayState?.current_screen
    ? _navData.overlayState.current_screen.replace(/_/g, ' ').toUpperCase()
    : 'STAND BY';

  const tabs = [
    { to: '/director',      label: 'DIRECTOR',     icon: Clapperboard, color: '#7C3AED' },
    { to: '/overlay-links', label: 'OBS LINKS',    icon: Monitor,      color: '#3B82F6' },
    { to: '/inputer',       label: 'DATA INPUTER', icon: Keyboard,     color: '#3B82F6' },
  ];

  const active = (to) => loc.pathname === to || (loc.pathname === '/' && to === '/director');

  return (
    <nav className="relative flex items-center justify-between border-b border-white/10 bg-[#060912] px-4 py-2 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#7C3AED] to-[#3B82F6]">
          <Zap className="h-4.5 w-4.5 text-black stroke-[2.5]" />
        </div>
        <div className="leading-none">
          <p className="font-orbitron text-xs font-black tracking-widest text-[#7C3AED]">NEXOVERLAYS</p>
          <p className="font-orbitron text-[9px] font-bold tracking-widest text-white">DIRECTOR</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
        {tabs.map(({ to, label, icon: Icon, color }) => {
          const isActive = active(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-4 py-1.5 rounded-[6px] transition-all"
              style={isActive ? { background: `${color}18`, color } : { color: 'rgba(255,255,255,0.4)' }}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? color : 'rgba(255,255,255,0.4)' }} />
              <span className="font-orbitron text-[11px] font-black tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: status + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[rgba(124,58,237,0.4)] bg-[#09090f] px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C3AED] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7C3AED]" />
          </span>
          <span className="font-orbitron text-[9px] font-black text-[#7C3AED] tracking-wider">
            LIVE: {currentScreenName}
          </span>
        </div>

        <a
          href="/overlay/scoreboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-1.5 text-[10px] font-orbitron font-black text-[rgba(255,255,255,0.6)] hover:border-[#7C3AED]/40 hover:text-white transition-all"
        >
          <Monitor className="h-3.5 w-3.5" /> OBS SOURCE <ExternalLink className="h-3 w-3" />
        </a>

        <button
          onClick={() => { try { logout(); } catch {} }}
          className="flex items-center gap-1 text-[10px] font-orbitron text-gray-500 hover:text-red-400 transition-colors bg-[#0f0f1a] border border-white/10 px-3 py-1.5 rounded-lg font-black"
        >
          <LogOut className="w-3.5 h-3.5" /> LOGOUT
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#7C3AED] via-transparent to-[#3B82F6]" />
    </nav>
  );
}

/* ── Routes ─────────────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user, subscription, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060915]">
        <div className="h-10 w-10 rounded-full border-4 border-[#7C3AED]/20 border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  // Overlay routes — always public, no auth needed
  const isOverlay = window.location.pathname.startsWith('/overlay');
  if (isOverlay) {
    return (
      <Routes>
        <Route path="/overlay" element={<Navigate to="/overlay/blank" replace />} />
        <Route path="/overlay/:screen" element={
          <PanelBoundary label="OVERLAY">
            <Overlay />
          </PanelBoundary>
        } />
      </Routes>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/overlay" element={<Navigate to="/overlay/blank" replace />} />
        <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Overlay /></PanelBoundary>} />
        <Route path="*" element={<PanelBoundary label="AUTH"><AuthPage /></PanelBoundary>} />
      </Routes>
    );
  }

  // No active subscription
  if (!isSubscribed(user, subscription)) {
    return (
      <Routes>
        <Route path="/overlay" element={<Navigate to="/overlay/blank" replace />} />
        <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Overlay /></PanelBoundary>} />
        <Route path="*" element={<PanelBoundary label="PRICING"><PricingPage /></PanelBoundary>} />
      </Routes>
    );
  }

  // Fully authenticated + subscribed
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/director" replace />} />
      <Route path="/director"      element={<PanelBoundary label="DIRECTOR"><DirectorPanel /></PanelBoundary>} />
      <Route path="/inputer"       element={<PanelBoundary label="DATA INPUTER"><DataInputer /></PanelBoundary>} />
      <Route path="/overlay"       element={<Navigate to="/overlay/blank" replace />} />
      <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Overlay /></PanelBoundary>} />
      <Route path="/overlay-links" element={<PanelBoundary label="OBS LINKS"><OverlayLinks /></PanelBoundary>} />
      <Route path="/control-panel" element={<Navigate to="/director" replace />} />
      <Route path="*"              element={<Navigate to="/director" replace />} />
    </Routes>
  );
}

/* ── Root ───────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary label="APP">
          <AuthProvider>
            <ScrollToTop />
            <div className="flex h-screen flex-col bg-[#09090f] text-white overflow-hidden">
              <NavBarContent />
              <div className="flex-1 overflow-hidden min-h-0">
                <AppRoutes />
              </div>
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f', color: '#fff',
            border: '1px solid rgba(124,58,237,0.3)',
            fontSize: '12px', fontFamily: 'Orbitron, sans-serif', fontWeight: '600',
          },
          success: { iconTheme: { primary: '#7C3AED', secondary: '#000' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
