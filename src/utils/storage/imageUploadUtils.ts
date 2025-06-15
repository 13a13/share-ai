
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';
import { toast } from "@/components/ui/use-toast";

/**
 * Upload a base64 image to Supabase Storage with proper name resolution
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

    // Always resolve names to ensure we have the correct values
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log("🔍 Resolved names for upload:", resolved);

    // Show warning if we're using generic fallbacks
    if (resolved.propertyName === "property" || resolved.roomName === "room") {
      toast({
        title: "Image Upload: Using Generic Names",
        description: `Image uploaded to generic folder structure. Property: "${resolved.propertyName}", Room: "${resolved.roomName}". Check your property and room data.`,
        variant: "destructive",
      });
      console.error("🚨 Using generic names during upload!", {
        reportId, roomId, resolved
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
    
    console.log("📤 Uploading to path:", fileName);
    
    // Upload to storage and return public URL
    return await uploadBlobToStorage(blob, fileName);
  } catch (error) {
    console.error("❌ Critical error in uploadReportImage:", error);
    throw error;
  }
};

/**
 * Upload multiple images to Supabase Storage with proper name resolution
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

    // Always resolve names first
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log("🔍 Resolved names for batch upload:", resolved);

    // Show warning if using generic names
    if (resolved.propertyName === "property" || resolved.roomName === "room") {
      toast({
        title: "Multi-Image Upload: Using Generic Names",
        description: `Images uploaded to generic folder structure. Property: "${resolved.propertyName}", Room: "${resolved.roomName}". Check your property and room data.`,
        variant: "destructive",
      });
      console.error("🚨 Using generic names during batch upload!", {
        reportId, roomId, resolved
      });
    }
    
    // Filter only data URLs that need uploading
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    console.log(`📊 Upload breakdown: ${dataUrls.length} new uploads, ${existingUrls.length} existing URLs`);
    
    if (dataUrls.length === 0) {
      return imageUrls;
    }

    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];

    for (let i = 0; i < dataUrls.length; i++) {
      try {
        console.log(`📤 Uploading image ${i + 1}/${dataUrls.length} to: ${resolved.propertyName}/${resolved.roomName}/${componentName}`);
        const uploadedUrl = await uploadReportImage(
          dataUrls[i], 
          reportId, 
          roomId, 
          resolved.propertyName, 
          resolved.roomName, 
          componentName
        );
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ Image ${i + 1} uploaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to upload image ${i + 1}:`, error);
        failedUploads.push(dataUrls[i]);
      }
    }

    const allUrls = [...existingUrls, ...uploadedUrls, ...failedUploads];
    return allUrls;
  } catch (error) {
    console.error("❌ Error in batch upload:", error);
    return imageUrls;
  }
};
