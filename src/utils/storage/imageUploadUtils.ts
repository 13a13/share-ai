
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';
import { toast } from "@/components/ui/use-toast";

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
    // Inputs must always be non-blank at this point (guaranteed by resolveNames)
    console.log("🔄 uploadReportImage called with parameters:", {
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      dataUrlLength: dataUrl.length
    });

    // If we spot any dirty name, throw user a toast
    if (
      propertyName === "unknown_property" ||
      roomName === "unknown_room"
    ) {
      toast({
        title: "Image Upload: Missing Data",
        description:
          "Image could not be linked to a valid property or room. Please check the room and property details and try again. (Names missing, uploaded to fallback folder)",
        variant: "destructive",
      });
      console.error("🚨 Could not resolve valid property/room names during upload!", {
        reportId, roomId, propertyName, roomName
      });
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
    throw error;
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
    // Inputs must always be non-blank at this point (guaranteed by resolveNames)
    console.log(`🚀 uploadMultipleReportImages called with:`, {
      imageCount: imageUrls.length,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName
    });

    // If we spot any dirty name, throw user a toast
    if (
      propertyName === "unknown_property" ||
      roomName === "unknown_room"
    ) {
      toast({
        title: "Multi-Image Upload: Missing Data",
        description:
          "Some images are being uploaded to a fallback folder due to missing property/room names. Please review your property/rooms data.",
        variant: "destructive",
      });
      console.error("🚨 Could not resolve valid property/room names during batch upload!", {
        reportId, roomId, propertyName, roomName
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
        console.log(`📤 Uploading image ${i + 1}/${dataUrls.length} to organized folder: ${propertyName}/${roomName}/${componentName}`);
        const uploadedUrl = await uploadReportImage(dataUrls[i], reportId, roomId, propertyName, roomName, componentName);
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ Image ${i + 1} uploaded successfully to organized folder`);
      } catch (error) {
        console.error(`❌ Failed to upload image ${i + 1}:`, error);
        failedUploads.push(dataUrls[i]);
      }
    }

    const allUrls = [...existingUrls, ...uploadedUrls, ...failedUploads];

    return allUrls;
  } catch (error) {
    console.error("❌ Error in batch upload:", error);
    // Return original URLs as fallback
    return imageUrls;
  }
};
