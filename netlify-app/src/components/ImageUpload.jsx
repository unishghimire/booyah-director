import React, { useState, useRef } from 'react';
import { Loader2, CheckCircle2, Image as ImageIcon, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

async function uploadToImgBB(file, name) {
  if (!IMGBB_KEY) throw new Error('VITE_IMGBB_API_KEY not set in Vercel env vars');
  const form = new FormData();
  form.append('image', file);
  if (name) form.append('name', name);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Upload failed');
  return { url: json.data.url, deleteUrl: json.data.delete_url };
}

export default function ImageUpload({ value, onChange, label = 'Upload Image', name = null, className = '', size = 'md' }) {
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [drag,      setDrag]      = useState(false);
  const [hover,     setHover]     = useState(false);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    if (file.size > 32 * 1024 * 1024) { toast.error('Max file size is 32 MB'); return; }
    setUploading(true); setSuccess(false);
    try {
      const { url, deleteUrl } = await uploadToImgBB(file, name);
      onChange(url, deleteUrl);
      setSuccess(true);
      toast.success('Image uploaded!');
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handle(file);
  };

  const minH = size === 'sm' ? 72 : 120;

  return (
    <div className={className}>
      {label && <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">{label}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          borderRadius: 12, borderWidth: 2, borderStyle: 'dashed',
          borderColor: drag ? '#FF6B00' : success ? '#22c55e' : hover && value ? '#00D4FF55' : 'rgba(255,255,255,0.08)',
          background: drag ? 'rgba(255,107,0,0.07)' : success ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.02)',
          minHeight: minH, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6, padding: size === 'sm' ? 10 : 16,
          cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {drag && <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 20px rgba(255,107,0,0.2)', pointerEvents:'none', borderRadius:10 }} />}
        {uploading ? (
          <><Loader2 className="h-6 w-6 text-[#FF6B00] animate-spin" /><span className="font-orbitron text-[9px] text-gray-400 tracking-wider">UPLOADING...</span></>
        ) : success ? (
          <><CheckCircle2 className="h-6 w-6 text-green-400" /><span className="font-orbitron text-[9px] text-green-400 tracking-wider">UPLOADED!</span></>
        ) : value ? (
          <div style={{ position:'relative', width:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src={value} alt="preview"
              style={{ maxHeight: size === 'sm' ? 52 : 90, maxWidth:'100%', objectFit:'contain', borderRadius:8, display:'block' }}
              onError={(e) => { e.target.style.display='none'; }}
            />
            {hover && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                <Edit3 className="h-5 w-5 text-[#00D4FF]" />
                <span className="font-orbitron text-[9px] text-[#00D4FF] tracking-wider">CHANGE IMAGE</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <ImageIcon className="h-6 w-6 text-gray-600" />
            {size !== 'sm' && <span className="text-xs text-gray-500">Drag & drop or click to upload</span>}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {['PNG','JPG','WebP'].map(f => <span key={f} className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-gray-600">{f}</span>)}
              <span className="font-orbitron text-[9px] text-gray-600 ml-1">· Max 32MB</span>
            </div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
    </div>
  );
}
