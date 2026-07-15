import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash, Download, Settings as SettingsIcon, ShieldAlert, Upload, CreditCard, Landmark, Key, AlertTriangle } from 'lucide-react';
import { adminFetch } from './Dashboard';
import toast from 'react-hot-toast';

const uploadToImgBB = async (file, apiKey) => {
  const form = new FormData();
  form.append('image', file);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method:'POST', body: form });
  const d = await r.json();
  if (!d.success) throw new Error('ImgBB upload failed');
  return d.data.url;
};

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'Booyah Director',
    mainAppUrl: '',
    maintenanceMode: false,
    allowNewRegistrations: true,
    freeTrialDays: 0,
    supportEmail: '',
    // Payment Settings Fields
    esewaNumber: '',
    esewaName: '',
    esewaQrUrl: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankBranch: '',
    bankQrUrl: '',
    khaltiNumber: '',
    khaltiName: '',
    khaltiQrUrl: '',
    imgbbApiKey: '',
  });
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Tabs for Payment Settings: 'esewa' | 'bank'
  const [paymentTab, setPaymentTab] = useState('esewa');

  const [uploadingEsewa, setUploadingEsewa] = useState(false);
  const [uploadingBank, setUploadingBank] = useState(false);
  const [uploadingKhalti, setUploadingKhalti] = useState(false);

  const esewaFileInputRef = useRef(null);
  const bankFileInputRef = useRef(null);
  const khaltiFileInputRef = useRef(null);

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

  const handleQrUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!settings.imgbbApiKey) {
      toast.error('Set ImgBB API key below to enable QR uploads');
      return;
    }

        if (type === 'khalti') {
      setUploadingKhalti(true);
      try {
        const url = await uploadToImgBB(file, settings.imgbbApiKey);
        setSettings(s => ({ ...s, khaltiQrUrl: url }));
        toast.success('Khalti QR Code updated. Click "Save Settings" below to store permanently.');
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploadingKhalti(false);
      }
    } else if (type === 'esewa') {
      setUploadingEsewa(true);
      try {
        const url = await uploadToImgBB(file, settings.imgbbApiKey);
        setSettings(s => ({ ...s, esewaQrUrl: url }));
        toast.success('eSewa QR Code updated. Click "Save Settings" below to store permanently.');
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploadingEsewa(false);
      }
    } else if (type === 'bank') {
      setUploadingBank(true);
      try {
        const url = await uploadToImgBB(file, settings.imgbbApiKey);
        setSettings(s => ({ ...s, bankQrUrl: url }));
        toast.success('Bank QR Code updated. Click "Save Settings" below to store permanently.');
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploadingBank(false);
      }
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
      {/* Payment Settings Section */}
      <div>
        <div className="mb-6">
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">PAYMENT SETTINGS</h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">CONFIGURE PRICING PAGE PAYMENT METHODS</p>
        </div>

        <div className="max-w-xl rounded-xl border border-white/5 bg-[#0a0e1a] p-6 space-y-6">
          {/* Payment Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setPaymentTab('esewa')}
              className={`flex items-center gap-2 px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider transition-all border-b-2 -mb-[1px] ${
                paymentTab === 'esewa'
                  ? 'border-[#FF6B00] text-white bg-[#FF6B00]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> ESEWA
            </button>
            <button
              onClick={() => setPaymentTab('bank')}
              className={`flex items-center gap-2 px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider transition-all border-b-2 -mb-[1px] ${
                paymentTab === 'bank'
                  ? 'border-[#00D4FF] text-white bg-[#00D4FF]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" /> BANK TRANSFER
            </button>
            <button
              onClick={() => setPaymentTab('khalti')}
              className={`flex items-center gap-2 px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider transition-all border-b-2 -mb-[1px] ${
                paymentTab === 'khalti'
                  ? 'border-[#a855f7] text-white bg-[#a855f7]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> KHALTI
            </button>
          </div>

          {/* Tab Content */}
                    {paymentTab === 'khalti' && (
            <div className="space-y-4">
              <Field label="KHALTI ID / NUMBER" field="khaltiNumber" placeholder="98XXXXXXXX" />
              <Field label="ACCOUNT HOLDER NAME" field="khaltiName" placeholder="e.g. John Doe" />
              
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">KHALTI QR CODE</label>
                {!settings.imgbbApiKey && (
                  <div className="flex items-center gap-2 text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 mb-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-orbitron text-[9px] tracking-wider font-bold">Set ImgBB API key below to enable QR uploads</span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  {settings.khaltiQrUrl ? (
                    <div className="relative group w-24 h-24 bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={settings.khaltiQrUrl} alt="Khalti QR" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => setSettings(s => ({...s, khaltiQrUrl: ''}))}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-orbitron text-[9px] font-black"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-black/40 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-500">
                      <CreditCard className="w-6 h-6 mb-1 opacity-40" />
                      <span className="font-orbitron text-[8px] tracking-widest text-center">NO QR</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      ref={khaltiFileInputRef} 
                      onChange={(e) => handleQrUpload(e, 'khalti')} 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                    />
                    <button
                      onClick={() => khaltiFileInputRef.current?.click()}
                      disabled={uploadingKhalti || !settings.imgbbApiKey}
                      className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 text-white rounded-lg font-orbitron text-[9px] font-black tracking-wider transition-all disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5" /> {uploadingKhalti ? 'UPLOADING...' : 'UPLOAD QR IMAGE'}
                    </button>
                    <p className="font-orbitron text-[8px] text-gray-600">Supports PNG, JPG. Max 32MB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentTab === 'esewa' && (
            <div className="space-y-4">
              <Field label="ESEWA NUMBER" field="esewaNumber" placeholder="98XXXXXXXX" />
              <Field label="ACCOUNT HOLDER NAME" field="esewaName" placeholder="e.g. John Doe" />
              
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">ESEWA QR CODE</label>
                {!settings.imgbbApiKey && (
                  <div className="flex items-center gap-2 text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 mb-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-orbitron text-[9px] tracking-wider font-bold">Set ImgBB API key below to enable QR uploads</span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  {settings.esewaQrUrl ? (
                    <div className="relative group w-24 h-24 bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={settings.esewaQrUrl} alt="eSewa QR" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => setSettings(s => ({...s, esewaQrUrl: ''}))}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-orbitron text-[9px] font-black"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-black/40 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-500">
                      <CreditCard className="w-6 h-6 mb-1 opacity-40" />
                      <span className="font-orbitron text-[8px] tracking-widest text-center">NO QR</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      ref={esewaFileInputRef} 
                      onChange={(e) => handleQrUpload(e, 'esewa')} 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                    />
                    <button
                      onClick={() => esewaFileInputRef.current?.click()}
                      disabled={uploadingEsewa || !settings.imgbbApiKey}
                      className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 text-white rounded-lg font-orbitron text-[9px] font-black tracking-wider transition-all disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5" /> {uploadingEsewa ? 'UPLOADING...' : 'UPLOAD QR IMAGE'}
                    </button>
                    <p className="font-orbitron text-[8px] text-gray-600">Supports PNG, JPG. Max 32MB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentTab === 'bank' && (
            <div className="space-y-4">
              <Field label="BANK NAME" field="bankName" placeholder="e.g. Nabil Bank" />
              <Field label="ACCOUNT NAME" field="bankAccountName" placeholder="e.g. John Doe" />
              <Field label="ACCOUNT NUMBER" field="bankAccountNumber" placeholder="e.g. 0123456789" />
              <Field label="BRANCH" field="bankBranch" placeholder="e.g. Lalitpur" />
              
              <div>
                <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">BANK QR CODE</label>
                {!settings.imgbbApiKey && (
                  <div className="flex items-center gap-2 text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 mb-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-orbitron text-[9px] tracking-wider font-bold">Set ImgBB API key below to enable QR uploads</span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  {settings.bankQrUrl ? (
                    <div className="relative group w-24 h-24 bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={settings.bankQrUrl} alt="Bank QR" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => setSettings(s => ({...s, bankQrUrl: ''}))}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-orbitron text-[9px] font-black"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-black/40 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-500">
                      <Landmark className="w-6 h-6 mb-1 opacity-40" />
                      <span className="font-orbitron text-[8px] tracking-widest text-center">NO QR</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      ref={bankFileInputRef} 
                      onChange={(e) => handleQrUpload(e, 'bank')} 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                    />
                    <button
                      onClick={() => bankFileInputRef.current?.click()}
                      disabled={uploadingBank || !settings.imgbbApiKey}
                      className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 text-white rounded-lg font-orbitron text-[9px] font-black tracking-wider transition-all disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5" /> {uploadingBank ? 'UPLOADING...' : 'UPLOAD QR IMAGE'}
                    </button>
                    <p className="font-orbitron text-[8px] text-gray-600">Supports PNG, JPG. Max 32MB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ImgBB Configuration */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-[#FF6B00]">
              <Key className="w-4 h-4" />
              <span className="font-orbitron text-[10px] font-black tracking-wider">IMAGE UPLOAD CONFIGURATION</span>
            </div>
            <div>
              <label className="font-orbitron text-[9px] text-gray-500 tracking-wider block mb-1.5">IMGBB API KEY</label>
              <input 
                type="password" 
                value={settings.imgbbApiKey || ''} 
                onChange={e => setSettings(s => ({...s, imgbbApiKey: e.target.value}))}
                placeholder="Paste your ImgBB API key here"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/50 font-mono"
              />
              <p className="font-orbitron text-[8px] text-gray-500 mt-1.5 tracking-wider">
                Used for QR code image uploads. Get your key at <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:underline">imgbb.com</a>
              </p>
            </div>
          </div>

          {/* Save Button for Payment Settings */}
          <div className="pt-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-orbitron text-[11px] font-black text-white tracking-wider disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #ff8c00)' }}>
              <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Settings Section */}
      <div>
        <div className="mb-6">
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider">PLATFORM SETTINGS</h1>
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
