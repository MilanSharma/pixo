import { supabase } from './supabase';

export async function uploadImage(userId: string, uri: string, filename: string): Promise<string> {
  const response = await fetch(uri);
  // Use arrayBuffer to ensure file data is fully read into memory before upload.
  // This fixes 0-byte uploads often seen with Blobs in React Native + Supabase.
  const arrayBuffer = await response.arrayBuffer();
  
  const filePath = `${userId}/${Date.now()}_${filename}`;
  
  // Auto-detect mime type from filename or default to jpeg
  const ext = filename.split('.').pop()?.toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === 'png') contentType = 'image/png';
  if (ext === 'gif') contentType = 'image/gif';
  if (ext === 'webp') contentType = 'image/webp';
  if (ext === 'mp4') contentType = 'video/mp4';
  if (ext === 'mov') contentType = 'video/quicktime';
  
  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadMultipleImages(userId: string, images: { uri: string; filename: string }[]): Promise<string[]> {
  const uploadPromises = images.map((img) => uploadImage(userId, img.uri, img.filename));
  return Promise.all(uploadPromises);
}

export async function deleteImage(filePath: string) {
  const { error } = await supabase.storage
    .from('media')
    .remove([filePath]);

  if (error) throw error;
}
