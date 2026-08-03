import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { overlayApi } from '@/lib/overlayApi';
import { Key, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function OrsConfigSection() {
  const [apiKey, setApiKey]   = useState('');
  const [saving, setSaving]    = useState(false);
  const [loading, setLoading]  = useState(true);
  const [showKey, setShowKey]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await overlayApi.getOrsConfig();
        setApiKey(res.api_key || '');
      } catch {
        /* not configured yet */
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    setSaving(true);
    try {
      await overlayApi.saveOrsConfig({ api_key: apiKey.trim() });
      toast.success('ORS API key saved');
    } catch {
      toast.error('Failed to save ORS API key');
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="mt-6 bg-[#131127] border border-white/[0.06] rounded-xl p-5">
      <h3 className="font-orbitron text-[10px] font-black tracking-widest text-[#7C3AED] mb-1 flex items-center gap-2">
        <Key className="h-4 w-4" /> ORS API CONFIGURATION
      </h3>
      <p className="text-xs text-white/40 mb-4">
        Enter your Open Result Service API key to enable automated result reporting.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-orbitron font-bold tracking-wider text-white/50 mb-1.5">API KEY</label>
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter ORS API key"
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#7C3AED] focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0 rounded-lg border border-white/[0.08] bg-white/5 p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider text-white hover:bg-[#9D5CFF] disabled:opacity-50 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'SAVING...' : 'SAVE API KEY'}
          </button>

          {apiKey && !saving && (
            <span className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold tracking-wider text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              API KEY CONFIGURED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
