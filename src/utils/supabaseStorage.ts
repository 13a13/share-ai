
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
    
    // Check if the inspection-images bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucket = buckets?.find(b => b.name === 'inspection-images');
    
    if (!reportsBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket('inspection-images', {
        public: true
      });
      
      if (createBucketError) {
        console.error("Error creating inspection-images bucket:", createBucketError);
        throw createBucketError;
      }
      console.log("Created new bucket: inspection-images");
    }
    
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
        upsert: true // Change to true to ensure file is always uploaded
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
    // Check if this is a Supabase storage URL by looking for the bucket name in the URL
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
