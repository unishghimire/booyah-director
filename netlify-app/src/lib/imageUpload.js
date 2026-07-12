import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, storage } from './firebase';

/**
 * Upload an image file to Firebase Storage under the authenticated user's folder.
 * @param {File} file
 * @param {'logos'|'banners'} folder
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadImage(file, folder = 'logos') {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to upload images');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
  const maxSize = folder === 'banners' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxSize) throw new Error(`File too large. Max: ${maxSize / 1024 / 1024}MB`);
  const ext  = file.name.split('.').pop().toLowerCase() || 'png';
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `users/${user.uid}/${folder}/${name}`;
  const snap = await uploadBytes(ref(storage, path), file, { contentType: file.type });
  const url  = await getDownloadURL(snap.ref);
  return { url, path };
}

export async function deleteImage(path) {
  try { await deleteObject(ref(storage, path)); } catch (e) { console.warn('deleteImage:', e.message); }
}
