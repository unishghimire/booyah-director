import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { overlayApi } from '@/lib/overlayApi';
import { Key, Save, Globe } from 'lucide-react';

export default function OrsConfigSection() {
  const [apiKey, setApiKey]       = useState('');
  const [destination, setDestination] = useState('');
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await overlayApi.getOrsConfig();
        setApiKey(res.api_key || '');
        setDestination(res.api_destination || '');
      } catch {
        /* ignore — not configured yet */
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await overlayApi.saveOrsConfig({ api_key: apiKey, api_destination: destination });
      toast.success('ORS configuration saved');
    } catch {
      toast.error('Failed to save ORS config');
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <h3 className="font-orbitron text-[10px] font-black tracking-widest text-[#7C3AED] mb-4 flex items-center gap-2">
        <Key className="h-4 w-4" /> ORS API CONFIGURATION
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Configure the Open Result Service API key and destination for automated result reporting.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-orbitron font-bold tracking-wider text-gray-400 mb-1.5">API KEY</label>
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter ORS API key"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-orbitron font-bold tracking-wider text-gray-400 mb-1.5">API DESTINATION URL</label>
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="https://api.openresultservice.com/v1/submit"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider text-white hover:bg-[#9D5CFF] disabled:opacity-50 transition-all"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'SAVING...' : 'SAVE CONFIGURATION'}
        </button>
      </div>
    </div>
  );
}
