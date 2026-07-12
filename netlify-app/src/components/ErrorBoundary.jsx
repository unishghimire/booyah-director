import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060915] text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-[#0a0a15] p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="font-orbitron text-lg font-black text-red-400 mb-2">SOMETHING WENT WRONG</h2>
          <p className="text-sm text-gray-400 mb-6">An unexpected error occurred. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500/20 border border-red-500/40 px-6 py-2 font-orbitron text-xs font-black text-red-400 hover:bg-red-500/30 transition-all">
            RELOAD PAGE
          </button>
        </div>
      </div>
    );
  }
}
