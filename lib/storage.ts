import { supabase } from './supabase';

export async function uploadImage(userId: string, uri: string, filename: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const filePath = `${userId}/${Date.now()}_${filename}`;
  
  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, blob, {
      contentType: blob.type || 'image/jpeg',
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
