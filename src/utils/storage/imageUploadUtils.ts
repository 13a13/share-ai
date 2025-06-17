
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';
import { withRetry, BATCH_RETRY_CONFIG, RetryContext } from './retryUtils';
import { toast } from "@/hooks/use-toast";

/**
 * Upload a base64 image to Supabase Storage with robust name resolution and retry logic
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
    console.log(`🔄 [UPLOAD v5] uploadReportImage called with retry logic:`, {
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      dataUrlLength: dataUrl.length
    });

    // CRITICAL: Always resolve names first with comprehensive validation
    console.log(`🔍 [UPLOAD v5] Resolving names before upload...`);
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log(`🔍 [UPLOAD v5] Resolved names:`, resolved);

    // Check for resolution failures
    if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_')) {
      const errorMsg = `Name resolution failed: Property="${resolved.propertyName}", Room="${resolved.roomName}"`;
      console.error(`❌ [UPLOAD v5] ${errorMsg}`);
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
      console.error(`🚨 [UPLOAD v5] ${warningMsg}`);
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
    
    console.log(`📤 [UPLOAD v5] Uploading to path with retry logic:`, fileName);
    console.log(`📤 [UPLOAD v5] Expected folder structure: ${resolved.propertyName}/${resolved.roomName}/${componentName || 'general'}`);
    
    // Upload to storage with retry logic (this now includes automatic retries)
    const publicUrl = await uploadBlobToStorage(blob, fileName);
    
    console.log(`✅ [UPLOAD v5] Upload successful with retries:`, publicUrl);
    
    // Verify the uploaded URL contains the correct folder structure
    if (publicUrl.includes(resolved.propertyName) && publicUrl.includes(resolved.roomName)) {
      console.log(`✅ [UPLOAD v5] Folder structure verified in URL!`);
    } else {
      console.error(`🚨 [UPLOAD v5] Folder structure NOT found in URL!`, {
        uploadedUrl: publicUrl,
        expectedProperty: resolved.propertyName,
        expectedRoom: resolved.roomName
      });
    }
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ [UPLOAD v5] Critical error in uploadReportImage after retries:`, error);
    
    // Enhanced error messaging with retry context
    if (error instanceof Error) {
      toast({
        title: "Upload Failed After Retries",
        description: `Image upload failed despite automatic retries: ${error.message}. Please check your connection and try again.`,
        variant: "destructive",
      });
    }
    
    throw error;
  }
};

/**
 * Upload multiple images to Supabase Storage with enhanced retry logic and batch error handling
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
    console.log(`🚀 [UPLOAD v5] uploadMultipleReportImages called with enhanced retry logic:`, {
      imageCount: imageUrls.length,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName
    });

    // Always resolve names first with validation
    console.log(`🔍 [UPLOAD v5] Resolving names for batch upload...`);
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log(`🔍 [UPLOAD v5] Resolved names for batch upload:`, resolved);

    // Check for resolution failures or generic names
    if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_') ||
        resolved.propertyName === "unknown_property" || resolved.roomName === "unknown_room") {
      const errorMsg = `Batch upload using problematic folder names: Property="${resolved.propertyName}", Room="${resolved.roomName}"`;
      console.error(`🚨 [UPLOAD v5] ${errorMsg}`);
      toast({
        title: "Batch Upload Warning",
        description: errorMsg,
        variant: "destructive",
      });
    }
    
    // Filter only data URLs that need uploading
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    console.log(`📊 [UPLOAD v5] Upload breakdown: ${dataUrls.length} new uploads, ${existingUrls.length} existing URLs`);
    
    if (dataUrls.length === 0) {
      return imageUrls;
    }

    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];
    let retryAttempts = 0;
    let totalRetryDelay = 0;

    // Enhanced batch upload with retry tracking
    for (let i = 0; i < dataUrls.length; i++) {
      try {
        console.log(`📤 [UPLOAD v5] Uploading image ${i + 1}/${dataUrls.length} to: ${resolved.propertyName}/${resolved.roomName}/${componentName}`);
        
        const uploadedUrl = await withRetry(
          async () => {
            return await uploadReportImage(
              dataUrls[i], 
              reportId, 
              roomId, 
              resolved.propertyName, 
              resolved.roomName, 
              componentName
            );
          },
          BATCH_RETRY_CONFIG,
          (context: RetryContext) => {
            if (context.error && context.attempt < context.totalAttempts) {
              retryAttempts++;
              totalRetryDelay += context.delay;
              console.log(`🔄 [BATCH RETRY] Image ${i + 1} attempt ${context.attempt}/${context.totalAttempts}, retrying in ${context.delay}ms`);
              
              // Show retry toast for batch operations
              toast({
                title: `Retrying Upload ${i + 1}/${dataUrls.length}`,
                description: `Network issue detected, retrying in ${Math.round(context.delay / 1000)}s...`,
              });
            }
          }
        );
        
        uploadedUrls.push(uploadedUrl);
        console.log(`✅ [UPLOAD v5] Image ${i + 1} uploaded successfully after any retries`);
      } catch (error) {
        console.error(`❌ [UPLOAD v5] Failed to upload image ${i + 1} after all retries:`, error);
        failedUploads.push(dataUrls[i]);
        
        // Enhanced error reporting for batch failures
        toast({
          title: `Upload ${i + 1}/${dataUrls.length} Failed`,
          description: `Image upload failed after automatic retries. Continuing with remaining images...`,
          variant: "destructive",
        });
      }
    }

    const allUrls = [...existingUrls, ...uploadedUrls, ...failedUploads];
    
    console.log(`📊 [UPLOAD v5] Batch upload complete with enhanced retry logic:`, {
      successful: uploadedUrls.length,
      failed: failedUploads.length,
      total: dataUrls.length,
      retryAttempts,
      totalRetryDelay: `${totalRetryDelay}ms`
    });
    
    // Enhanced completion notification with retry statistics
    if (uploadedUrls.length > 0) {
      toast({
        title: "Batch Upload Complete",
        description: `${uploadedUrls.length}/${dataUrls.length} images uploaded successfully${retryAttempts > 0 ? ` (${retryAttempts} automatic retries performed)` : ''}`,
      });
    }
    
    if (failedUploads.length > 0) {
      toast({
        title: "Some Uploads Failed",
        description: `${failedUploads.length} images failed to upload despite retries. Please check your connection and try again.`,
        variant: "destructive",
      });
    }
    
    return allUrls;
  } catch (error) {
    console.error(`❌ [UPLOAD v5] Critical error in batch upload with retry logic:`, error);
    
    // Show enhanced error message for batch failures
    toast({
      title: "Batch Upload Failed",
      description: "Batch upload failed after automatic retries. Please check your connection and try again.",
      variant: "destructive",
    });
    
    return imageUrls;
  }
};
