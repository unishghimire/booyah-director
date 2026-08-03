import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from '@/components/ScrollToTop';
import { ErrorBoundary, PanelBoundary } from '@/components/ErrorBoundary';
import AuthPage from '@/pages/AuthPage';
import PricingPage from '@/pages/PricingPage';
import { lazy, Suspense } from 'react';
const DirectorPanel = lazy(() => import('./pages/DirectorPanel'));
const Overlay       = lazy(() => import('./pages/Overlay'));
const OverlayLinks  = lazy(() => import('./pages/OverlayLinks'));
const DataInputer   = lazy(() => import('./pages/DataInputer'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-[#070611]">
    <div className="h-10 w-10 rounded-full border-4 border-white/5 border-t-[#7C3AED] animate-spin" />
  </div>
);
import { useOverlayData } from '@/lib/overlayApi';
import { Clapperboard, Keyboard, Monitor, ExternalLink, Zap, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import ConnectionStatusBar from '@/components/ConnectionStatusBar';

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

/* ── Top Header ───────────────────────────────────────────────────────────── */
function TopHeader() {
  const { user, subscription, logout } = useAuth();
  const { data: _navData } = useOverlayData(true);
  const _screen = _navData?.overlayState?.current_screen;
  const currentScreenName = _screen
    ? _screen.replace(/_/g, ' ').toUpperCase()
    : 'STAND BY';

  return (
    <header className="nx-glass-header relative flex items-center justify-between px-4 py-2.5 flex-shrink-0 user-select-none h-12">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7C3AED] active:scale-95 transition-transform">
          <Zap className="h-4 w-4 text-white stroke-[2.5]" />
        </div>
        <div className="leading-none">
          <p className="font-orbitron text-xs font-black tracking-widest text-[#9D5CFF]">NEXOVERLAYS</p>
          <p className="font-orbitron text-[9px] font-bold tracking-widest text-white/50">DIRECTOR</p>
        </div>
      </div>

      {/* Right: status + logout */}
      <div className="flex items-center gap-2.5">
        {/* Live status pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.05)] px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C3AED] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          </span>
          <span className="font-orbitron text-[9px] font-black text-[#9D5CFF] tracking-wider">
            {currentScreenName}
          </span>
        </div>

        {/* OBS Source */}
        <a
          href="/overlay/scoreboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[10px] font-orbitron font-black text-white/50 hover:text-white hover:border-white/[0.12] transition-all active:scale-[0.98]"
        >
          <Monitor className="h-3.5 w-3.5" /> <span className="hidden sm:inline">OBS</span> <ExternalLink className="h-3 w-3" />
        </a>

        {/* Logout */}
        <button
          onClick={() => { try { logout(); } catch {} }}
          className="flex items-center gap-1 text-[10px] font-orbitron text-white/40 hover:text-red-400 transition-colors border border-white/[0.06] px-2.5 py-1.5 rounded-lg font-black active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">LOGOUT</span>
        </button>
      </div>
    </header>
  );
}

/* ── Bottom Bar ───────────────────────────────────────────────────────────── */
function BottomBar({ loc }) {
  const tabs = [
    { to: '/director',      label: 'DIRECTOR',     icon: Clapperboard, color: '#9D5CFF' },
    { to: '/inputer',      label: 'INPUTER',       icon: Keyboard,     color: '#06b6d4' },
    { to: '/overlay-links', label: 'OBS LINKS',    icon: Monitor,      color: '#60A5FA' },
  ];

  const active = (to) => loc.pathname === to || (loc.pathname === '/' && to === '/director');

  return (
    <div className="md:hidden nx-glass-header border-t border-white/[0.06] p-1.5 flex items-center justify-around user-select-none relative flex-shrink-0 z-10">
      {tabs.map(({ to, label, icon: Icon, color }) => {
        const isActive = active(to);
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-all flex-1 active:scale-95"
            style={isActive ? { color } : { color: 'rgba(255,255,255,0.35)' }}
          >
            <Icon className="h-4 w-4" style={{ color: isActive ? color : 'rgba(255,255,255,0.35)' }} />
            <span className="font-orbitron text-[9px] font-black tracking-wider text-center">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Shell Layout ────────────────────────────────────────────────────────── */
function ShellLayout({ children }) {
  const { user, subscription, loading } = useAuth();
  const loc = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    return localStorage.getItem('sidebar_expanded') !== 'false';
  });

  const isOverlay = loc.pathname.startsWith('/overlay/');
  const hasShell = !loading && user && isSubscribed(user, subscription) && !isOverlay;

  if (!hasShell) {
    return (
      <div className="flex h-screen flex-col bg-[#070611] text-white overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#070611] text-white overflow-hidden">
      {/* 1. Global OBS Connection Status Bar */}
      <ConnectionStatusBar />

      {/* 2. Main layout grid with sidebar and right content panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar on Desktop */}
        <aside className={`hidden md:flex flex-col border-r border-white/[0.06] bg-[#070611] sidebar-transition h-full flex-shrink-0 ${isSidebarExpanded ? 'w-[200px]' : 'w-[56px]'}`}>
          <div className="flex h-12 items-center justify-between px-3 border-b border-white/[0.04] user-select-none">
            {isSidebarExpanded ? (
              <span className="nx-section-label pl-2">NAV</span>
            ) : (
              <span className="mx-auto"><Zap className="h-4 w-4 text-[#7C3AED]" /></span>
            )}
            <button
              onClick={() => {
                const nextVal = !isSidebarExpanded;
                setIsSidebarExpanded(nextVal);
                localStorage.setItem('sidebar_expanded', String(nextVal));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 text-white/40 hover:text-white/80 transition-all active:scale-95"
            >
              {isSidebarExpanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto user-select-none">
            {[
              { to: '/director',      label: 'DIRECTOR',     icon: Clapperboard, color: '#9D5CFF' },
              { to: '/inputer',      label: 'INPUTER',       icon: Keyboard,     color: '#06b6d4' },
              { to: '/overlay-links', label: 'OBS LINKS',    icon: Monitor,      color: '#60A5FA' },
            ].map(({ to, label, icon: Icon, color }) => {
              const isActive = loc.pathname === to || (loc.pathname === '/' && to === '/director');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-md transition-all active:scale-[0.98] ${
                    isActive ? 'bg-white/[0.06] text-white' : 'text-white/35 hover:bg-white/[0.03] hover:text-white/70'
                  }`}
                  title={label}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? color : 'currentColor' }} />
                  {isSidebarExpanded && (
                    <span className="font-orbitron text-[11px] font-black tracking-wider whitespace-nowrap">
                      {label}
                    </span>
                  )}
                  {isActive && isSidebarExpanded && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right Area: Top Header + Page Content + Bottom Mobile Navigation Bar */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TopHeader />
          
          <main className="flex-1 overflow-hidden min-h-0 relative">
            <PanelBoundary label="MAIN_CONTENT">
              {children}
            </PanelBoundary>
          </main>

          <BottomBar loc={loc} />
        </div>
      </div>
    </div>
  );
}

/* ── Routes ─────────────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user, subscription, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070611]">
        <div className="h-10 w-10 rounded-full border-4 border-white/5 border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  // Overlay routes — always public, no auth needed
  const location = useLocation();
  const isOverlay = location.pathname.startsWith('/overlay/');
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
        <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Suspense fallback={<PageLoader />}><Overlay /></Suspense></PanelBoundary>} />
        <Route path="*" element={<PanelBoundary label="AUTH"><AuthPage /></PanelBoundary>} />
      </Routes>
    );
  }

  // No active subscription
  if (!isSubscribed(user, subscription)) {
    return (
      <Routes>
        <Route path="/overlay" element={<Navigate to="/overlay/blank" replace />} />
        <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Suspense fallback={<PageLoader />}><Overlay /></Suspense></PanelBoundary>} />
        <Route path="*" element={<PanelBoundary label="PRICING"><PricingPage /></PanelBoundary>} />
      </Routes>
    );
  }

  // Fully authenticated + subscribed
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/director" replace />} />
      <Route path="/director"      element={<PanelBoundary label="DIRECTOR"><Suspense fallback={<PageLoader />}><DirectorPanel /></Suspense></PanelBoundary>} />
      <Route path="/overlay"       element={<Navigate to="/overlay/blank" replace />} />
      <Route path="/overlay/:screen" element={<PanelBoundary label="OVERLAY"><Suspense fallback={<PageLoader />}><Overlay /></Suspense></PanelBoundary>} />
      <Route path="/overlay-links"  element={<PanelBoundary label="OVERLAY_LINKS"><Suspense fallback={<PageLoader />}><OverlayLinks /></Suspense></PanelBoundary>} />
      <Route path="/inputer"       element={<PanelBoundary label="INPUTER"><Suspense fallback={<PageLoader />}><DataInputer /></Suspense></PanelBoundary>} />
      <Route path="/pricing"       element={<PanelBoundary label="PRICING"><PricingPage /></PanelBoundary>} />
      <Route path="*"              element={<Navigate to="/director" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <ErrorBoundary>
          <ShellLayout>
            <AppRoutes />
          </ShellLayout>
        </ErrorBoundary>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#131127',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
