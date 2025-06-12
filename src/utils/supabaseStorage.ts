
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get the current user's full name for folder structure
 */
const getUserFullName = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("⚠️ No authenticated user found, using 'unknown_user'");
      return 'unknown_user';
    }

    // Try to get user profile information
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.warn("⚠️ Could not fetch user profile, using email or fallback");
      // Fallback to email or user ID
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return emailName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
    }

    // Combine first and last name
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    if (!fullName) {
      console.warn("⚠️ No name found in profile, using email or fallback");
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return emailName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
    }

    // Clean the full name for folder structure
    return fullName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  } catch (error) {
    console.error("❌ Error getting user full name:", error);
    return 'unknown_user';
  }
};

/**
 * Upload a base64 image to Supabase Storage with user/property/room/component-based folder structure
 */
export const uploadReportImage = async (
  dataUrl: string,
  reportId: string,
  roomId: string,
  propertyName?: string,
  roomName?: string,
  componentName?: string
): Promise<string> => {
  try {
    console.log("🔄 Starting image upload to storage for report:", reportId, "room:", roomId, "property:", propertyName, "roomName:", roomName, "component:", componentName);
    
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    console.log("📦 Image converted to blob, size:", blob.size, "type:", blob.type);
    
    // Get user's full name for folder structure
    const userFullName = await getUserFullName();
    console.log("👤 User full name for folder structure:", userFullName);
    
    // Generate a unique filename with user/property/room/component-based folder structure
    const fileExt = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';base64'));
    
    // Clean names for folder structure (remove special characters)
    const cleanPropertyName = propertyName 
      ? propertyName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase()
      : 'unknown_property';
    
    const cleanRoomName = roomName
      ? roomName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase()
      : `room_${roomId.substring(0, 8)}`;
    
    const cleanComponentName = componentName
      ? componentName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase()
      : 'general';
    
    // Create folder structure: user_full_name/property_name/room_name/component_name/filename
    const fileName = `${userFullName}/${cleanPropertyName}/${cleanRoomName}/${cleanComponentName}/${uuidv4()}.${fileExt || 'jpg'}`;
    
    console.log("📂 Upload path with user-based folder structure:", fileName);
    
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
    
    console.log("✅ File uploaded successfully to user-organized folder:", data.path);
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('inspection-images')
      .getPublicUrl(data.path);
    
    console.log("🔗 Public URL generated:", publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("❌ Critical error in uploadReportImage:", error);
    throw error; // Don't return fallback, let caller handle the error
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
    
    console.log("🗑️ Deleting file from user-organized folder:", fileName);
    
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
 * Upload multiple images to Supabase Storage with user/property/room/component-based organization
 */
export const uploadMultipleReportImages = async (
  imageUrls: string[],
  reportId: string,
  roomId: string,
  propertyName?: string,
  roomName?: string,
  componentName?: string
): Promise<string[]> => {
  try {
    // Get user's full name once for the batch
    const userFullName = await getUserFullName();
    console.log(`🚀 Starting batch upload of ${imageUrls.length} images to user-organized folders: ${userFullName}/${propertyName}/${roomName}/${componentName}`);
    
    // Filter only data URLs that need uploading
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    console.log(`📊 Upload breakdown: ${dataUrls.length} new uploads, ${existingUrls.length} existing URLs`);
    
    if (dataUrls.length === 0) {
      console.log("✅ No new images to upload");
      return imageUrls;
    }
    
    // Upload each image individually and collect results
    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];
    
    for (let i = 0; i < dataUrls.length; i++) {
      try {
        console.log(`📤 Uploading image ${i + 1}/${dataUrls.length} to user-organized folder`);
        const uploadedUrl = await uploadReportImage(dataUrls[i], reportId, roomId, propertyName, roomName, componentName);
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ Image ${i + 1} uploaded successfully to user-organized folder`);
      } catch (error) {
        console.error(`❌ Failed to upload image ${i + 1}:`, error);
        failedUploads.push(dataUrls[i]);
      }
    }
    
    console.log(`📊 Upload results: ${uploadedUrls.length} successful, ${failedUploads.length} failed`);
    
    // Combine existing URLs with successfully uploaded URLs
    // For failed uploads, use original data URLs as fallback
    const allUrls = [...existingUrls, ...uploadedUrls, ...failedUploads];
    
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
    
    // Since we just created the bucket with the migration, we know it exists
    // But let's still test access to be sure
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
      
      console.log("✅ Storage bucket accessible and ready for uploads");
      return true;
    } catch (accessError) {
      console.error("❌ Error testing storage access:", accessError);
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking storage bucket:", error);
    return false;
  }
};
