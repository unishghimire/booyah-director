import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// ── Global unhandled errors ───────────────────────────────────────────────────
// Prevent silent failures from crashing the app without any feedback

window.addEventListener('unhandledrejection', (e) => {
  // Suppress noisy Firebase internals in production
  const msg = e?.reason?.message || '';
  if (msg.includes('auth/network-request-failed') || msg.includes('Failed to fetch')) return;
  if (import.meta.env.DEV) console.warn('[UnhandledPromise]', e.reason);
  e.preventDefault(); // prevent browser console error spam in prod
});

window.addEventListener('error', (e) => {
  // Chunk load failure — new deploy while user is on old version
  if (e?.message?.includes('Failed to fetch dynamically imported module') ||
      e?.message?.includes('ChunkLoadError')) {
    console.warn('[ChunkLoad] Reloading for new deployment...');
    window.location.reload();
  }
});

// ── React render ─────────────────────────────────────────────────────────────
const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <ErrorBoundary fullScreen label="APP">
      <App />
    </ErrorBoundary>
  );
} else {
  // root element missing — fatal, show inline message
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#060915;font-family:monospace;color:#f87171;text-align:center;padding:24px">
      <div>
        <div style="font-size:32px;margin-bottom:12px">⚠️</div>
        <div style="font-size:14px;font-weight:700">BOOYAH DIRECTOR could not start</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px">Root element not found. Please reload.</div>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:rgba(255,107,0,0.2);border:1px solid rgba(255,107,0,0.4);border-radius:8px;color:#FF6B00;font-size:12px;cursor:pointer">RELOAD</button>
      </div>
    </div>`;
}
