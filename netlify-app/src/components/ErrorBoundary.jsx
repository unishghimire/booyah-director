/**
 * ErrorBoundary.jsx — Crash isolation system
 *
 * THREE levels of protection:
 *  1. <ErrorBoundary fullScreen>   — App-level (wraps entire app in main.jsx)
 *  2. <PanelBoundary label="X">   — Page-level (wraps each Director/Inputer panel)
 *  3. <SectionBoundary label="X">  — Component-level (wraps each card/section)
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
      return <React.Fragment key={retryKey}>{children}</React.Fragment>;
    }

    const handleRetry = () => { onRetry?.(); this.retry(); };

    if (fullScreen) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060915', fontFamily: 'Orbitron, sans-serif', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#f87171', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>APPLICATION ERROR</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 24 }}>
              Something went wrong at startup. This is usually a temporary issue.
              {import.meta.env.DEV && error?.message && (<span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: 4, padding: '4px 8px' }}>{error.message}</span>)}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleRetry} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>RETRY</button>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>RELOAD APP</button>
            </div>
          </div>
        </div>
      );
    }

    if (inline) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#f87171', letterSpacing: 1, flex: 1 }}>{label ? `${label} FAILED` : 'SECTION ERROR'}</span>
          <button onClick={handleRetry} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1 }}>RETRY</button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', padding: '32px 24px', textAlign: 'center', gap: 12 }}>
        <AlertTriangle style={{ width: 28, height: 28, color: '#f87171' }} />
        <div>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 900, color: '#f87171', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{label ? `${label} PANEL ERROR` : 'PANEL ERROR'}</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            This section crashed. Other panels are still working.
            {import.meta.env.DEV && error?.message && (<span style={{ display: 'block', marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', borderRadius: 4, padding: '3px 8px' }}>{error.message}</span>)}
          </p>
        </div>
        <button onClick={handleRetry} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 10, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw style={{ width: 12, height: 12 }} /> RETRY
        </button>
      </div>
    );
  }
}

export function ErrorBoundary({ children, label }) {
  return <_ErrorBoundary fullScreen label={label}>{children}</_ErrorBoundary>;
}

export function PanelBoundary({ children, label, onRetry }) {
  return <_ErrorBoundary label={label} onRetry={onRetry}>{children}</_ErrorBoundary>;
}

export function SectionBoundary({ children, label }) {
  return <_ErrorBoundary inline label={label}>{children}</_ErrorBoundary>;
}

export function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

export default ErrorBoundary;
