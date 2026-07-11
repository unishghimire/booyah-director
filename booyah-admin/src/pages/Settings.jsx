import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'Booyah Director',
    mainAppUrl: '',
    maintenanceMode: false,
    allowNewRegistrations: true,
    freeTrialDays: 0,
    supportEmail: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('settings').then(d => { if (d.settings && Object.keys(d.settings).length) setSettings(s => ({...s, ...d.settings})); }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { await adminFetch('settings', { method: 'POST', body: JSON.stringify(settings) }); toast.success('Settings saved'); }
    catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const Field = ({ label, field, type = 'text', placeholder }) => (
    <div>
      <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">{label}</label>
      <input type={type} value={settings[field] || ''} onChange={e => setSettings(s => ({...s, [field]: type === 'number' ? +e.target.value : e.target.value}))}
        placeholder={placeholder}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
      />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-orbitron text-lg font-black text-white tracking-wider">SETTINGS</h1>
        <p className="font-orbitron text-[9px] text-gray-500 mt-1">PLATFORM CONFIGURATION</p>
      </div>
      <div className="max-w-xl rounded-xl border border-white/5 bg-[#0a0e1a] p-6 space-y-4">
        <Field label="PLATFORM NAME" field="platformName" placeholder="Booyah Director" />
        <Field label="MAIN APP URL" field="mainAppUrl" placeholder="https://your-app.netlify.app" />
        <Field label="SUPPORT EMAIL" field="supportEmail" placeholder="support@booyah.gg" />
        <Field label="FREE TRIAL DAYS" field="freeTrialDays" type="number" />
        <div className="flex items-center gap-3">
          <input type="checkbox" id="maintenance" checked={settings.maintenanceMode}
            onChange={e => setSettings(s => ({...s, maintenanceMode: e.target.checked}))}
            className="w-4 h-4 accent-[#FF6B00]"
          />
          <label htmlFor="maintenance" className="font-orbitron text-[10px] text-gray-400">MAINTENANCE MODE</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="newregs" checked={settings.allowNewRegistrations}
            onChange={e => setSettings(s => ({...s, allowNewRegistrations: e.target.checked}))}
            className="w-4 h-4 accent-[#FF6B00]"
          />
          <label htmlFor="newregs" className="font-orbitron text-[10px] text-gray-400">ALLOW NEW REGISTRATIONS</label>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-orbitron text-[11px] font-black text-white tracking-wider disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
          <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </div>
    </div>
  );
}
