/**
 * ErrorBoundary.jsx — Crash isolation system
 *
 * THREE levels of protection:
 *  1. <ErrorBoundary fullScreen>   — App-level (wraps entire app in main.jsx)
 *  2. <PanelBoundary label="X">   — Page-level (wraps each Director/Inputer panel)
 *  3. <SectionBoundary label="X"> — Component-level (wraps each card/section)
 *
 * None of these crash the app — they catch, display an inline error tile,
 * and offer Retry (re-mounts the component without reloading the page).
 *
 * Companion hooks:
 *  useSafe(fn)         — wraps any async function so it never throws
 *  SafeList            — renders .map() without crashing on bad items
 *  safeGet(obj, path)  — null-safe deep property access
 */

import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

/* ══════════════════════════════════════════════════
   BASE ERROR BOUNDARY CLASS
══════════════════════════════════════════════════ */
class _ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Only log in dev — never expose internals in production
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', this.props.label || 'APP', error, info?.componentStack?.split('\n')[1] || '');
    }
  }

  retry() {
    this.setState(s => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }));
  }

  render() {
    const { hasError, error, retryKey } = this.state;
    const { children, fullScreen, inline, label, onRetry } = this.props;

    if (!hasError) {
      return (
        <React.Fragment key={retryKey}>
          {children}
        </React.Fragment>
      );
    }

    const handleRetry = () => {
      onRetry?.();
      this.retry();
    };

    // ── FULL SCREEN (app-level crash) ───────────────
    if (fullScreen) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#060915', fontFamily: 'Orbitron, sans-serif', padding: 24,
        }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#f87171', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
              APPLICATION ERROR
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 24 }}>
              Something went wrong at startup. This is usually a temporary issue.
              {import.meta.env.DEV && error?.message && (
                <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: 4, padding: '4px 8px' }}>
                  {error.message}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleRetry} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>
                RETRY
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>
                RELOAD APP
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── INLINE (section/card-level crash) ──────────
    if (inline) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.06)',
        }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#f87171', letterSpacing: 1, flex: 1 }}>
            {label ? `${label} FAILED` : 'SECTION ERROR'}
          </span>
          <button onClick={handleRetry} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1 }}>
            RETRY
          </button>
        </div>
      );
    }

    // ── PANEL (page-level crash — large card) ──────
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 200, borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)',
        background: 'rgba(239,68,68,0.04)', padding: '32px 24px', textAlign: 'center',
        gap: 12,
      }}>
        <AlertTriangle style={{ width: 28, height: 28, color: '#f87171' }} />
        <div>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 900, color: '#f87171', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            {label ? `${label} PANEL ERROR` : 'PANEL ERROR'}
          </h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            This section crashed. Other panels are still working.
            {import.meta.env.DEV && error?.message && (
              <span style={{ display: 'block', marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', borderRadius: 4, padding: '3px 8px' }}>
                {error.message}
              </span>
            )}
          </p>
        </div>
        <button onClick={handleRetry} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw style={{ width: 12, height: 12 }} /> RETRY
        </button>
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════
   EXPORTED BOUNDARY VARIANTS
══════════════════════════════════════════════════ */

/** App root boundary — shows full-screen error page */
export function ErrorBoundary({ children, label }) {
  return <_ErrorBoundary fullScreen label={label}>{children}</_ErrorBoundary>;
}

/** Page boundary — wraps entire Director/Inputer/Overlay pages */
export function PanelBoundary({ children, label, onRetry }) {
  return <_ErrorBoundary label={label} onRetry={onRetry}>{children}</_ErrorBoundary>;
}

/** Section boundary — wraps individual cards/sections (inline mini-error) */
export function SectionBoundary({ children, label }) {
  return <_ErrorBoundary inline label={label}>{children}</_ErrorBoundary>;
}

export default ErrorBoundary;

/* ══════════════════════════════════════════════════
   SAFE UTILITIES — use these throughout components
══════════════════════════════════════════════════ */

/**
 * safeGet — null-safe deep property access
 * safeGet(obj, 'a.b.c', fallback) instead of obj?.a?.b?.c || fallback
 */
export function safeGet(obj, path, fallback = null) {
  try {
    return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * safeArray — ensures a value is always a usable array
 * Prevents .map() crashes on null/undefined/non-arrays
 */
export function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  return [];
}

/**
 * safeNumber — ensures a value is always a finite number
 */
export function safeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * safeString — ensures a value is always a string, never null/undefined
 */
export function safeString(val, fallback = '') {
  if (val == null) return fallback;
  return String(val);
}

/**
 * SafeList — renders a list safely, skipping broken items
 * Usage: <SafeList items={teams} render={(team, i) => <TeamRow key={team.id} ... />} empty={<p>No teams</p>} />
 */
export function SafeList({ items, render, empty = null, label = 'ITEM' }) {
  const arr = safeArray(items);
  if (arr.length === 0) return empty;
  return arr.map((item, i) => {
    try {
      return (
        <SectionBoundary key={item?.id || i} label={`${label} ${i + 1}`}>
          {render(item, i)}
        </SectionBoundary>
      );
    } catch {
      return null;
    }
  });
}
