
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
    console.log("🔄 Starting image upload to storage for report:", reportId, "room:", roomId);
    
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    console.log("📦 Image converted to blob, size:", blob.size, "type:", blob.type);
    
    // Generate a unique filename with property and room folder structure
    const fileExt = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';base64'));
    const fileName = `${reportId}/${roomId}/${uuidv4()}.${fileExt || 'jpg'}`;
    
    console.log("📂 Upload path:", fileName);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inspection-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("❌ Storage upload error:", error);
      throw error;
    }
    
    console.log("✅ File uploaded successfully:", data.path);
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('inspection-images')
      .getPublicUrl(data.path);
    
    console.log("🔗 Public URL generated:", publicUrlData.publicUrl);
    
    // Verify the upload by checking if file exists
    const { data: fileExists, error: listError } = await supabase.storage
      .from('inspection-images')
      .list(data.path.substring(0, data.path.lastIndexOf('/')), {
        search: data.path.substring(data.path.lastIndexOf('/') + 1)
      });
    
    if (listError) {
      console.warn("⚠️ Could not verify file upload:", listError);
    } else if (fileExists && fileExists.length > 0) {
      console.log("✅ File upload verified, file exists in storage");
    } else {
      console.warn("⚠️ File upload verification failed, file not found");
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("❌ Critical error in uploadReportImage:", error);
    // Return the original data URL as fallback
    return dataUrl;
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteReportImage = async (imageUrl: string): Promise<void> => {
  try {
    console.log("🗑️ Attempting to delete image:", imageUrl);
    
    // Check if this is a Supabase storage URL
    if (!imageUrl.includes('/storage/v1/object/public/inspection-images/') && !imageUrl.includes('inspection-images/')) {
      console.log("⏭️ Not a Supabase storage URL, skipping deletion");
      return;
    }
    
    // Extract the path from the URL
    const urlPath = new URL(imageUrl).pathname;
    const pathParts = urlPath.split('/');
    const bucketIndex = pathParts.indexOf('inspection-images');
    
    if (bucketIndex === -1) {
      console.log("❌ Could not find bucket name in URL:", imageUrl);
      return;
    }
    
    const fileName = pathParts.slice(bucketIndex + 1).join('/');
    
    if (!fileName) {
      console.log("❌ Could not extract file path from URL:", imageUrl);
      return;
    }
    
    console.log("🗑️ Deleting file:", fileName);
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('inspection-images')
      .remove([fileName]);
    
    if (error) {
      console.error("❌ Error deleting image from storage:", error);
    } else {
      console.log("✅ Image deleted successfully from storage:", fileName);
    }
  } catch (error) {
    console.error("❌ Error in deleteReportImage:", error);
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
    console.log(`🚀 Starting batch upload of ${imageUrls.length} images`);
    
    // Filter only data URLs that need uploading
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    console.log(`📊 Upload breakdown: ${dataUrls.length} new uploads, ${existingUrls.length} existing URLs`);
    
    if (dataUrls.length === 0) {
      console.log("✅ No new images to upload");
      return imageUrls;
    }
    
    const uploadPromises = dataUrls.map((imageUrl, index) => {
      console.log(`📤 Queuing upload ${index + 1}/${dataUrls.length}`);
      return uploadReportImage(imageUrl, reportId, roomId);
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    console.log(`✅ Batch upload completed: ${uploadedUrls.length} new URLs generated`);
    
    // Combine existing URLs with newly uploaded URLs
    const allUrls = [...existingUrls, ...uploadedUrls];
    
    // Verify uploads
    const successfulUploads = uploadedUrls.filter(url => !url.startsWith('data:')).length;
    console.log(`📊 Upload success rate: ${successfulUploads}/${dataUrls.length} images uploaded to storage`);
    
    return allUrls;
  } catch (error) {
    console.error("❌ Error in batch upload:", error);
    // Return original URLs as fallback
    return imageUrls;
  }
};

/**
 * Check if storage bucket exists and is accessible
 */
export const checkStorageBucket = async (): Promise<boolean> => {
  try {
    console.log("🔍 Checking storage bucket availability...");
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("❌ Error checking storage buckets:", error);
      return false;
    }
    
    const inspectionBucket = data?.find(bucket => bucket.name === 'inspection-images');
    const bucketExists = !!inspectionBucket;
    
    console.log("📦 Inspection images bucket exists:", bucketExists);
    
    // Test upload access if bucket exists
    if (bucketExists) {
      try {
        console.log("🔐 Testing bucket access permissions...");
        
        // Try to list objects to test access
        const { data: listData, error: listError } = await supabase.storage
          .from('inspection-images')
          .list('', { limit: 1 });
        
        if (listError) {
          console.error("❌ Storage bucket exists but access denied:", listError);
          return false;
        }
        
        console.log("✅ Storage bucket accessible, found", listData?.length || 0, "items");
        return true;
      } catch (accessError) {
        console.error("❌ Error testing storage access:", accessError);
        return false;
      }
    }
    
    return bucketExists;
  } catch (error) {
    console.error("❌ Error checking storage bucket:", error);
    return false;
  }
};
