import React from 'react';

export default function StatCard({ title, value, sub, icon: Icon, accent = '#FF6B00' }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0e1a] p-5" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-orbitron text-[9px] font-black tracking-widest text-gray-500">{title}</p>
          <p className="mt-2 font-orbitron text-3xl font-black" style={{ color: accent }}>{value ?? '—'}</p>
          {sub && <p className="mt-1 font-orbitron text-[8px] text-gray-600">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}
