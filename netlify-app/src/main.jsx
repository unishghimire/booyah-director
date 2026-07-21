import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

/* ── Global promise rejection handler ───────────────────────────────────────
   Catches unhandled promise rejections (e.g. failed fetches, Firebase errors)
   so they don't silently crash background logic or spam the console in prod.
────────────────────────────────────────────────────────────────────────────── */
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || '';
  // Suppress known noisy-but-harmless Firebase network errors
  const ignore = [
    'auth/network-request-failed',
    'Failed to fetch',
    'NetworkError',
    'Load failed',
    'The user is not authenticated',
  ];
  if (ignore.some(s => msg.includes(s))) { e.preventDefault(); return; }
  if (import.meta.env.DEV) console.warn('[UnhandledPromise]', e.reason);
  e.preventDefault(); // stop browser from logging in prod
});

/* ── Chunk-load failure handler ─────────────────────────────────────────────
   When Vercel deploys a new build while the user has the old one open,
   dynamic imports fail with ChunkLoadError. We auto-reload once to fix it.
────────────────────────────────────────────────────────────────────────────── */
window.addEventListener('error', (e) => {
  const msg = e?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed')
  ) {
    // Avoid infinite reload loops — mark that we already tried
    if (!sessionStorage.getItem('_chunk_reload')) {
      sessionStorage.setItem('_chunk_reload', '1');
      console.warn('[ChunkLoad] New deployment detected — reloading...');
      window.location.reload();
    }
  }
});

// Clear chunk-reload flag on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('_chunk_reload');
});

/* ── React render ────────────────────────────────────────────────────────── */
const rootEl = document.getElementById('root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary label="APP">
      <App />
    </ErrorBoundary>
  );
} else {
  // No root element — DOM is broken
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#060915;font-family:Orbitron,sans-serif;color:#f87171;text-align:center;padding:24px">
      <div>
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <div style="font-size:13px;font-weight:900;letter-spacing:2px">NEXOVERLAYS FAILED TO START</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px">Root element missing. Try clearing your browser cache.</div>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:8px;color:#7C3AED;font-size:11px;cursor:pointer;font-family:Orbitron,sans-serif;font-weight:900;letter-spacing:1px">
          RELOAD
        </button>
      </div>
    </div>`;
}
