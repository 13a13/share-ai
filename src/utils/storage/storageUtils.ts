
import { supabase } from '@/integrations/supabase/client';
import { withRetry, STORAGE_RETRY_CONFIG, RetryContext } from './retryUtils';

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
 * Upload blob to Supabase Storage with retry logic
 */
export const uploadBlobToStorage = async (
  blob: Blob,
  fileName: string,
  bucketName: string = 'inspection-images'
): Promise<string> => {
  console.log("🔄 Starting upload with retry logic:", fileName);
  
  return withRetry(
    async () => {
      console.log("📤 Attempting upload to storage:", fileName);
      
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
        // Enhance error message for better retry classification
        const enhancedError = new Error(`Storage upload failed: ${error.message}`);
        enhancedError.name = error.message.includes('rate limit') ? 'Storage rate limit exceeded' : 'StorageError';
        throw enhancedError;
      }
      
      console.log("✅ File uploaded successfully to user-organized folder:", data.path);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      console.log("🔗 Public URL generated:", publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;
    },
    STORAGE_RETRY_CONFIG,
    (context: RetryContext) => {
      // Log retry progress
      if (context.error) {
        console.log(`🔄 [UPLOAD RETRY] Attempt ${context.attempt}/${context.totalAttempts} failed, retrying in ${context.delay}ms:`, {
          error: context.error.message,
          fileName,
          isRetryable: context.isRetryable
        });
      }
    }
  );
};

/**
 * Delete file from Supabase Storage with retry logic
 */
export const deleteFileFromStorage = async (
  fileName: string,
  bucketName: string = 'inspection-images'
): Promise<void> => {
  console.log("🔄 Starting delete with retry logic:", fileName);
  
  return withRetry(
    async () => {
      console.log("🗑️ Attempting to delete file from storage:", fileName);
      
      // Delete from storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);
      
      if (error) {
        console.error("❌ Error deleting image from storage:", error);
        // Enhance error message for better retry classification
        const enhancedError = new Error(`Storage delete failed: ${error.message}`);
        enhancedError.name = error.message.includes('rate limit') ? 'Storage rate limit exceeded' : 'StorageError';
        throw enhancedError;
      }
      
      console.log("✅ Image deleted successfully from storage:", fileName);
    },
    STORAGE_RETRY_CONFIG,
    (context: RetryContext) => {
      // Log retry progress
      if (context.error) {
        console.log(`🔄 [DELETE RETRY] Attempt ${context.attempt}/${context.totalAttempts} failed, retrying in ${context.delay}ms:`, {
          error: context.error.message,
          fileName,
          isRetryable: context.isRetryable
        });
      }
    }
  );
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
