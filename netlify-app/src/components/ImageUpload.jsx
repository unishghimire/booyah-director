import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import toast from 'react-hot-toast';

/**
 * ImageUpload — drag-and-drop image uploader via ImgBB (free CDN)
 *
 * Props:
 *   value     {string}   current image URL (shows preview)
 *   onChange  {fn}       called with (url, deleteUrl) on success
 *   label     {string}   label text above the drop zone
 *   name      {string}   optional filename hint sent to ImgBB
 *   className {string}   extra wrapper class
 */
export default function ImageUpload({ value, onChange, label = 'Upload Image', name = null, className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag]           = useState(false);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, deleteUrl } = await uploadImage(file, name);
      onChange(url, deleteUrl);
      toast.success('Image uploaded!');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handle(file);
  };

  return (
    <div className={className}>
      {label && (
        <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">
          {label}
        </p>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        style={{
          borderRadius: 12,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: drag ? '#FF6B00' : 'rgba(255,255,255,0.08)',
          background:  drag ? 'rgba(255,107,0,0.06)' : 'rgba(255,255,255,0.02)',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
          padding: 12,
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-[#FF6B00] animate-spin" />
            <span className="font-orbitron text-[9px] text-gray-400 tracking-wider">UPLOADING...</span>
          </>
        ) : value ? (
          <>
            <img
              src={value}
              alt="preview"
              className="h-16 max-w-full object-contain rounded-lg"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="font-orbitron text-[9px] text-[#00D4FF] tracking-wider">CLICK TO CHANGE</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-6 w-6 text-gray-600" />
            <span className="text-xs text-gray-500">Drag & drop or click to upload</span>
            <div className="flex items-center gap-1">
              <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-gray-600">PNG</span>
              <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-gray-600">JPG</span>
              <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-gray-600">WebP</span>
              <span className="font-orbitron text-[9px] text-gray-600 ml-1">· Max 32MB · Free CDN</span>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
    </div>
  );
}
