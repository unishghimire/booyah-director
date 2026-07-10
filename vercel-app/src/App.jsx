import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from '@/components/ScrollToTop';
import ControlPanel from './pages/ControlPanel';
import Overlay from './pages/Overlay';

const queryClient = new QueryClient();

function NavBar() {
  const loc = useLocation();
  if (loc.pathname === '/overlay') return null;
  const isControl = loc.pathname === '/control-panel' || loc.pathname === '/';
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-orange-500/20 bg-[#07070f] px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="font-orbitron text-lg font-black tracking-wider text-orange-500">BOOYAH</span>
        <span className="font-orbitron text-lg font-black tracking-wider text-white">DIRECTOR</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/control-panel"
          className={`rounded-lg px-4 py-1.5 text-sm font-bold transition ${
            isControl ? 'bg-orange-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Control Panel
        </Link>
        <Link
          to="/overlay"
          target="_blank"
          className="rounded-lg px-4 py-1.5 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          OBS Overlay ↗
        </Link>
      </div>
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
              <Route path="/" element={<ControlPanel />} />
              <Route path="/control-panel" element={<ControlPanel />} />
              <Route path="/overlay" element={<Overlay />} />
            </Routes>
          </div>
        </div>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181f',
            color: '#fff',
            border: '1px solid rgba(249,115,22,0.3)',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  );
}