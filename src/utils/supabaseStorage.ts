
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
    console.log("Uploading image to storage for room:", roomId);
    
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    
    // Check if the reports bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucket = buckets?.find(b => b.name === 'reports');
    
    if (!reportsBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket('reports', {
        public: true
      });
      
      if (createBucketError) {
        console.error("Error creating reports bucket:", createBucketError);
        throw createBucketError;
      }
    }
    
    // Generate a unique filename
    const fileExt = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';base64'));
    const fileName = `${reportId}/${roomId}/${uuidv4()}.${fileExt || 'jpg'}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('reports')
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
      .from('reports')
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
    if (!imageUrl.includes(supabase.storageUrl) || !imageUrl.includes('reports/')) {
      console.log("Not a Supabase storage URL, skipping deletion");
      return;
    }
    
    // Extract the path from the URL
    const urlPath = new URL(imageUrl).pathname;
    const pathParts = urlPath.split('/');
    const fileName = pathParts.slice(pathParts.indexOf('reports') + 1).join('/');
    
    if (!fileName) {
      console.log("Could not extract file path from URL:", imageUrl);
      return;
    }
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('reports')
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
