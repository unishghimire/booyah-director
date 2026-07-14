import React, { useState, useEffect } from 'react';
import { Save, Trash, Download, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
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
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const loadSettings = async () => {
    try {
      const d = await adminFetch('settings');
      if (d.settings && Object.keys(d.settings).length) {
        setSettings(s => ({...s, ...d.settings}));
      }
    } catch (_) {}
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const d = await adminFetch('list-admins');
      setAdmins(d.admins || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load admins');
    }
    setLoadingAdmins(false);
  };

  useEffect(() => {
    loadSettings();
    loadAdmins();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch('settings', { method: 'POST', body: JSON.stringify(settings) });
      toast.success('Settings saved');
      loadSettings();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const clearPayments = async () => {
    if (!window.confirm('Are you absolutely sure you want to CLEAR ALL PAYMENT REQUESTS? This action is irreversible.')) return;
    try {
      await adminFetch('clear-payments', { method: 'POST' });
      toast.success('All payment requests cleared successfully!');
    } catch (e) {
      toast.error(e.message || 'Failed to clear payments');
    }
  };

  const exportUserData = async () => {
    try {
      const data = await adminFetch('export-users');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booyah-users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('User data exported successfully!');
    } catch (e) {
      toast.error(e.message || 'Failed to export user data');
    }
  };

  const revokeAdmin = async (uid, email) => {
    if (!window.confirm(`Revoke admin access for ${email || uid}?`)) return;
    try {
      await adminFetch('revoke-admin', { method: 'POST', body: JSON.stringify({ uid }) });
      toast.success('Admin access revoked');
      loadAdmins();
    } catch (e) {
      toast.error(e.message || 'Failed to revoke admin');
    }
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
    <div className="space-y-8">
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

      {/* Admin Management Section */}
      <div>
        <div className="mb-4">
          <h2 className="font-orbitron text-sm font-black text-white tracking-wider">ADMINS MANAGEMENT</h2>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">MANAGE ADMINISTRATOR ACCOUNTS</p>
        </div>
        <div className="max-w-xl rounded-xl border border-white/5 bg-[#0a0e1a] overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px] text-[9px] font-orbitron font-black text-gray-500 tracking-widest px-4 py-3 border-b border-white/5">
            <div>ADMIN EMAIL</div><div>ROLE</div><div>ACTIONS</div>
          </div>
          {loadingAdmins ? (
            <div className="flex items-center justify-center h-24">
              <div className="h-6 w-6 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-6 font-orbitron text-[10px] text-gray-600">NO ADMINS FOUND</div>
          ) : admins.map(admin => (
            <div key={admin.uid} className="grid grid-cols-[1fr_120px_100px] items-center px-4 py-3 border-b border-white/3">
              <div>
                <p className="font-mono text-[11px] text-white">{admin.email}</p>
                <p className="font-mono text-[8px] text-gray-500">{admin.uid}</p>
              </div>
              <div className="font-orbitron text-[10px] text-gray-400 uppercase">{admin.role || 'admin'}</div>
              <div>
                <button onClick={() => revokeAdmin(admin.uid, admin.email)} className="p-1.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all font-orbitron text-[8px] font-bold">
                  REVOKE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone Section */}
      <div>
        <div className="mb-4 flex items-center gap-2 text-red-500">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="font-orbitron text-sm font-black tracking-wider">DANGER ZONE</h2>
        </div>
        <div className="max-w-xl rounded-xl border border-red-500/20 bg-red-950/10 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-red-500/10 pb-4">
            <div>
              <p className="font-orbitron text-[11px] font-black text-white tracking-wider">CLEAR ALL PAYMENT REQUESTS</p>
              <p className="font-orbitron text-[9px] text-gray-500 mt-1">Deletes all transaction and manual verification records.</p>
            </div>
            <button onClick={clearPayments} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-orbitron text-[9px] font-black tracking-wider rounded-lg transition-all">
              CLEAR PAYMENTS
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-orbitron text-[11px] font-black text-white tracking-wider">EXPORT USER DATA</p>
              <p className="font-orbitron text-[9px] text-gray-500 mt-1">Download full active user directory list as a JSON backup.</p>
            </div>
            <button onClick={exportUserData} className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white/20 text-white font-orbitron text-[9px] font-black tracking-wider rounded-lg transition-all">
              <Download className="w-3.5 h-3.5" /> EXPORT DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
