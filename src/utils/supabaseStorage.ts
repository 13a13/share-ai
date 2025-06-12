
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a base64 image to Supabase Storage
 */
export const uploadReportImage = async (
  dataUrl: string,
  reportId: string,
  roomId: string
): Promise<string> => {
  try {
    console.log("Uploading image to storage for report:", reportId, "room:", roomId);
    
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    
    // Generate a unique filename with property and room folder structure
    const fileExt = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';base64'));
    const fileName = `${reportId}/${roomId}/${uuidv4()}.${fileExt || 'jpg'}`;
    
    console.log("Uploading to path:", fileName);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inspection-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error uploading image to storage:", error);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('inspection-images')
      .getPublicUrl(data.path);
    
    console.log("Image uploaded successfully:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadReportImage:", error);
    // Return the original data URL as fallback
    return dataUrl;
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteReportImage = async (imageUrl: string): Promise<void> => {
  try {
    // Check if this is a Supabase storage URL
    if (!imageUrl.includes('/storage/v1/object/public/inspection-images/') && !imageUrl.includes('inspection-images/')) {
      console.log("Not a Supabase storage URL, skipping deletion");
      return;
    }
    
    // Extract the path from the URL
    const urlPath = new URL(imageUrl).pathname;
    const pathParts = urlPath.split('/');
    const bucketIndex = pathParts.indexOf('inspection-images');
    
    if (bucketIndex === -1) {
      console.log("Could not find bucket name in URL:", imageUrl);
      return;
    }
    
    const fileName = pathParts.slice(bucketIndex + 1).join('/');
    
    if (!fileName) {
      console.log("Could not extract file path from URL:", imageUrl);
      return;
    }
    
    console.log("Deleting file:", fileName);
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('inspection-images')
      .remove([fileName]);
    
    if (error) {
      console.error("Error deleting image from storage:", error);
    } else {
      console.log("Image deleted successfully:", fileName);
    }
  } catch (error) {
    console.error("Error in deleteReportImage:", error);
  }
};

/**
 * Upload multiple images to Supabase Storage
 */
export const uploadMultipleReportImages = async (
  imageUrls: string[],
  reportId: string,
  roomId: string
): Promise<string[]> => {
  try {
    const uploadPromises = imageUrls.map(imageUrl => 
      uploadReportImage(imageUrl, reportId, roomId)
    );
    
    const uploadedUrls = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${uploadedUrls.length} images to storage`);
    
    return uploadedUrls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    // Return original URLs as fallback
    return imageUrls;
  }
};

/**
 * Check if storage bucket exists and is accessible
 */
export const checkStorageBucket = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return false;
    }
    
    const inspectionBucket = data?.find(bucket => bucket.name === 'inspection-images');
    const bucketExists = !!inspectionBucket;
    
    console.log("Inspection images bucket exists:", bucketExists);
    
    // Also try to test upload access
    if (bucketExists) {
      try {
        // Try to list objects to test access
        const { error: listError } = await supabase.storage
          .from('inspection-images')
          .list('', { limit: 1 });
        
        if (listError) {
          console.error("Storage bucket exists but access denied:", listError);
          return false;
        }
        
        console.log("Storage bucket accessible for uploads");
        return true;
      } catch (accessError) {
        console.error("Error testing storage access:", accessError);
        return false;
      }
    }
    
    return bucketExists;
  } catch (error) {
    console.error("Error checking storage bucket:", error);
    return false;
  }
};
