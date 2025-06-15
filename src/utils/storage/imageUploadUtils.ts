
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';
import { toast } from "@/hooks/use-toast";

/**
 * Upload a base64 image to Supabase Storage with robust name resolution
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
    console.log(`🔄 [UPLOAD v4] uploadReportImage called with:`, {
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      dataUrlLength: dataUrl.length
    });

    // CRITICAL: Always resolve names first with comprehensive validation
    console.log(`🔍 [UPLOAD v4] Resolving names before upload...`);
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log(`🔍 [UPLOAD v4] Resolved names:`, resolved);

    // Check for resolution failures
    if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_')) {
      const errorMsg = `Name resolution failed: Property="${resolved.propertyName}", Room="${resolved.roomName}"`;
      console.error(`❌ [UPLOAD v4] ${errorMsg}`);
      toast({
        title: "Upload Error: Name Resolution Failed",
        description: errorMsg,
        variant: "destructive",
      });
      // Continue with error names for debugging purposes
    }

    // Check for generic fallbacks
    if (resolved.propertyName === "unknown_property" || resolved.roomName === "unknown_room") {
      const warningMsg = `Using generic folder names: Property="${resolved.propertyName}", Room="${resolved.roomName}". Check your data integrity.`;
      console.error(`🚨 [UPLOAD v4] ${warningMsg}`);
      toast({
        title: "Upload Warning: Generic Folder Names",
        description: warningMsg,
        variant: "destructive",
      });
    }
    
    // Convert data URL to blob
    const blob = await dataUrlToBlob(dataUrl);
    
    // Get file extension
    const fileExt = getFileExtensionFromDataUrl(dataUrl);
    
    // Generate folder path with resolved names
    const fileName = await generateFolderPath(
      reportId, 
      roomId, 
      resolved.propertyName, 
      resolved.roomName, 
      componentName, 
      fileExt
    );
    
    console.log(`📤 [UPLOAD v4] Uploading to path:`, fileName);
    console.log(`📤 [UPLOAD v4] Expected folder structure: ${resolved.propertyName}/${resolved.roomName}/${componentName || 'general'}`);
    
    // Upload to storage and return public URL
    const publicUrl = await uploadBlobToStorage(blob, fileName);
    
    console.log(`✅ [UPLOAD v4] Upload successful:`, publicUrl);
    
    // Verify the uploaded URL contains the correct folder structure
    if (publicUrl.includes(resolved.propertyName) && publicUrl.includes(resolved.roomName)) {
      console.log(`✅ [UPLOAD v4] Folder structure verified in URL!`);
    } else {
      console.error(`🚨 [UPLOAD v4] Folder structure NOT found in URL!`, {
        uploadedUrl: publicUrl,
        expectedProperty: resolved.propertyName,
        expectedRoom: resolved.roomName
      });
    }
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ [UPLOAD v4] Critical error in uploadReportImage:`, error);
    throw error;
  }
};

/**
 * Upload multiple images to Supabase Storage with robust name resolution
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
    console.log(`🚀 [UPLOAD v4] uploadMultipleReportImages called with:`, {
      imageCount: imageUrls.length,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName
    });

    // Always resolve names first with validation
    console.log(`🔍 [UPLOAD v4] Resolving names for batch upload...`);
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log(`🔍 [UPLOAD v4] Resolved names for batch upload:`, resolved);

    // Check for resolution failures or generic names
    if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_') ||
        resolved.propertyName === "unknown_property" || resolved.roomName === "unknown_room") {
      const errorMsg = `Batch upload using problematic folder names: Property="${resolved.propertyName}", Room="${resolved.roomName}"`;
      console.error(`🚨 [UPLOAD v4] ${errorMsg}`);
      toast({
        title: "Batch Upload Warning",
        description: errorMsg,
        variant: "destructive",
      });
    }
    
    // Filter only data URLs that need uploading
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    console.log(`📊 [UPLOAD v4] Upload breakdown: ${dataUrls.length} new uploads, ${existingUrls.length} existing URLs`);
    
    if (dataUrls.length === 0) {
      return imageUrls;
    }

    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];

    for (let i = 0; i < dataUrls.length; i++) {
      try {
        console.log(`📤 [UPLOAD v4] Uploading image ${i + 1}/${dataUrls.length} to: ${resolved.propertyName}/${resolved.roomName}/${componentName}`);
        const uploadedUrl = await uploadReportImage(
          dataUrls[i], 
          reportId, 
          roomId, 
          resolved.propertyName, 
          resolved.roomName, 
          componentName
        );
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ [UPLOAD v4] Image ${i + 1} uploaded successfully`);
      } catch (error) {
        console.error(`❌ [UPLOAD v4] Failed to upload image ${i + 1}:`, error);
        failedUploads.push(dataUrls[i]);
      }
    }

    const allUrls = [...existingUrls, ...uploadedUrls, ...failedUploads];
    
    console.log(`📊 [UPLOAD v4] Batch upload complete: ${uploadedUrls.length}/${dataUrls.length} successful uploads`);
    
    return allUrls;
  } catch (error) {
    console.error(`❌ [UPLOAD v4] Error in batch upload:`, error);
    return imageUrls;
  }
};
