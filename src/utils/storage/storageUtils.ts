
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert data URL to blob
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  console.log("📦 Image converted to blob, size:", blob.size, "type:", blob.type);
  return blob;
};

/**
 * Extract file extension from data URL
 */
export const getFileExtensionFromDataUrl = (dataUrl: string): string => {
  return dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';base64'));
};

/**
 * Upload blob to Supabase Storage
 */
export const uploadBlobToStorage = async (
  blob: Blob,
  fileName: string,
  bucketName: string = 'inspection-images'
): Promise<string> => {
  console.log("🔄 Uploading blob to storage:", fileName);
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, blob, {
      contentType: blob.type,
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error("❌ Storage upload error:", error);
    throw error;
  }
  
  console.log("✅ File uploaded successfully to user-organized folder:", data.path);
  
  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);
  
  console.log("🔗 Public URL generated:", publicUrlData.publicUrl);
  
  return publicUrlData.publicUrl;
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFileFromStorage = async (
  fileName: string,
  bucketName: string = 'inspection-images'
): Promise<void> => {
  console.log("🗑️ Deleting file from user-organized folder:", fileName);
  
  // Delete from storage
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);
  
  if (error) {
    console.error("❌ Error deleting image from storage:", error);
    throw error;
  } else {
    console.log("✅ Image deleted successfully from storage:", fileName);
  }
};

/**
 * Extract file path from storage URL
 */
export const extractFilePathFromUrl = (imageUrl: string, bucketName: string = 'inspection-images'): string | null => {
  try {
    // Check if this is a Supabase storage URL
    if (!imageUrl.includes('/storage/v1/object/public/inspection-images/') && !imageUrl.includes('inspection-images/')) {
      console.log("⏭️ Not a Supabase storage URL, skipping deletion");
      return null;
    }
    
    // Extract the path from the URL
    const urlPath = new URL(imageUrl).pathname;
    const pathParts = urlPath.split('/');
    const bucketIndex = pathParts.indexOf(bucketName);
    
    if (bucketIndex === -1) {
      console.log("❌ Could not find bucket name in URL:", imageUrl);
      return null;
    }
    
    const fileName = pathParts.slice(bucketIndex + 1).join('/');
    
    if (!fileName) {
      console.log("❌ Could not extract file path from URL:", imageUrl);
      return null;
    }
    
    return fileName;
  } catch (error) {
    console.error("❌ Error extracting file path from URL:", error);
    return null;
  }
};
