import React from 'react';

/**
 * ErrorBoundary — catches React render/lifecycle errors.
 * Used at app root AND around each major panel for isolation:
 * one broken panel won't crash the whole app.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Only log in dev — never expose stack traces to end users
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label || 'APP';

    return (
      <div style={{
        minHeight: this.props.fullScreen ? '100vh' : '200px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: this.props.fullScreen ? '#060915' : 'transparent',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: 420, width: '100%', textAlign: 'center',
          borderRadius: 16, border: '1px solid rgba(239,68,68,0.3)',
          background: '#0a0a15', padding: '32px 24px',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <h2 style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 900,
            color: '#f87171', letterSpacing: 2, marginBottom: 8,
          }}>
            {label} FAILED TO LOAD
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
            An unexpected error occurred in this section.{' '}
            {this.props.fullScreen
              ? 'The app will reload automatically.'
              : 'Other parts of the app are still working.'}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null, info: null })}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
                fontFamily: 'Orbitron, sans-serif', fontSize: 10, fontWeight: 900,
                color: '#f87171', cursor: 'pointer', letterSpacing: 1,
              }}
            >
              RETRY
            </button>
            {this.props.fullScreen && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid rgba(255,107,0,0.4)', background: 'rgba(255,107,0,0.1)',
                  fontFamily: 'Orbitron, sans-serif', fontSize: 10, fontWeight: 900,
                  color: '#FF6B00', cursor: 'pointer', letterSpacing: 1,
                }}
              >
                RELOAD APP
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

/** Convenience wrapper for non-fullscreen panel boundaries */
export function PanelBoundary({ label, children }) {
  return (
    <ErrorBoundary label={label} fullScreen={false}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
