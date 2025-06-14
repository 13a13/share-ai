
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';

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
    console.log("🔄 uploadReportImage called with parameters:", {
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      dataUrlLength: dataUrl.length
    });
    
    // Validate input parameters
    if (!propertyName || propertyName.trim() === '') {
      console.warn("⚠️ propertyName is empty or undefined in uploadReportImage");
    }
    if (!roomName || roomName.trim() === '') {
      console.warn("⚠️ roomName is empty or undefined in uploadReportImage");
    }
    
    // Convert data URL to blob
    const blob = await dataUrlToBlob(dataUrl);
    
    // Get file extension
    const fileExt = getFileExtensionFromDataUrl(dataUrl);
    
    // Generate folder path
    const fileName = await generateFolderPath(reportId, roomId, propertyName, roomName, componentName, fileExt);
    
    // Upload to storage and return public URL
    return await uploadBlobToStorage(blob, fileName);
  } catch (error) {
    console.error("❌ Critical error in uploadReportImage:", error);
    throw error; // Don't return fallback, let caller handle the error
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
    console.log(`🚀 uploadMultipleReportImages called with:`, {
      imageCount: imageUrls.length,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName
    });
    
    // Validate input parameters
    if (!propertyName || propertyName.trim() === '') {
      console.warn("⚠️ propertyName is empty or undefined in uploadMultipleReportImages");
    }
    if (!roomName || roomName.trim() === '') {
      console.warn("⚠️ roomName is empty or undefined in uploadMultipleReportImages");
    }
    
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
        console.log(`📤 Uploading image ${i + 1}/${dataUrls.length} to organized folder: ${propertyName}/${roomName}/${componentName}`);
        const uploadedUrl = await uploadReportImage(dataUrls[i], reportId, roomId, propertyName, roomName, componentName);
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ Image ${i + 1} uploaded successfully to organized folder`);
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
