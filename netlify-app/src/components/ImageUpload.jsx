import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import toast from 'react-hot-toast';

export default function ImageUpload({ value, onChange, folder = 'logos', label = 'Upload Image', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, path } = await uploadImage(file, folder);
      onChange(url, path);
      toast.success('Image uploaded!');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div className={className}>
      {label && <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">{label}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        style={{
          borderColor: drag ? '#FF6B00' : 'rgba(255,255,255,0.1)',
          background: drag ? 'rgba(255,107,0,0.06)' : 'rgba(255,255,255,0.02)',
          minHeight: 72, borderRadius: 12, borderWidth: 2,
          borderStyle: 'dashed', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 6,
          padding: 12, cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <><Loader2 className="h-5 w-5 text-[#FF6B00] animate-spin" /><span className="text-xs text-gray-400">Uploading...</span></>
        ) : value ? (
          <><img src={value} alt="preview" className="h-14 w-14 object-contain rounded-lg" /><span className="text-[10px] text-[#00D4FF]">Click to change</span></>
        ) : (
          <><Upload className="h-5 w-5 text-gray-500" /><span className="text-xs text-gray-500">Drag & drop or click</span><span className="text-[10px] text-gray-600">PNG/JPG/WebP · {folder==='banners'?'5MB':'2MB'} max</span></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files[0] && handle(e.target.files[0])} />
    </div>
  );
}
