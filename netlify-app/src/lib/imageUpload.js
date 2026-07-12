/**
 * imageUpload.js — ImgBB free image hosting
 * 
 * Free tier: unlimited uploads, permanent CDN URLs, no credit card
 * API key: get yours free at https://api.imgbb.com/
 * Set VITE_IMGBB_API_KEY in your Vercel environment variables.
 *
 * Returns a permanent CDN URL like:
 *   https://i.ibb.co/xxxxx/filename.png
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

/**
 * Upload an image file to ImgBB and return the CDN URL.
 * @param {File} file        - The image file
 * @param {string} [name]    - Optional custom display name
 * @returns {Promise<{url: string, deleteUrl: string}>}
 */
export async function uploadImage(file, name = null) {
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed (PNG, JPG, WebP, GIF)');

  const maxSize = 32 * 1024 * 1024; // ImgBB free limit: 32MB
  if (file.size > maxSize) throw new Error('File too large. ImgBB allows up to 32MB.');

  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key not set. Add VITE_IMGBB_API_KEY to your Vercel environment variables. Get a free key at https://api.imgbb.com/');
  }

  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]); // strip data:image/...;base64,
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const form = new FormData();
  form.append('key', IMGBB_API_KEY);
  form.append('image', base64);
  if (name) form.append('name', name);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: form,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || 'ImgBB upload failed');
  }

  return {
    url:       data.data.url,         // permanent CDN URL
    thumb:     data.data.thumb?.url,  // thumbnail URL
    deleteUrl: data.data.delete_url,  // one-click delete link
  };
}
