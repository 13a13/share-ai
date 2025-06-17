
import { generateFolderPath } from './folderUtils';
import { dataUrlToBlob, getFileExtensionFromDataUrl, uploadBlobToStorage } from './storageUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';
import { withRetry, BATCH_RETRY_CONFIG, RetryContext } from './retryUtils';
import { BatchUploadManager } from './batchUploadManager';
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
    console.log(`🔄 [UPLOAD v6] uploadReportImage called with enhanced retry logic:`, {
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      dataUrlLength: dataUrl.length
    });

    // CRITICAL: Always resolve names first with comprehensive validation
    console.log(`🔍 [UPLOAD v6] Resolving names before upload...`);
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    
    console.log(`🔍 [UPLOAD v6] Resolved names:`, resolved);

    // Check for resolution failures
    if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_')) {
      const errorMsg = `Name resolution failed: Property="${resolved.propertyName}", Room="${resolved.roomName}"`;
      console.error(`❌ [UPLOAD v6] ${errorMsg}`);
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
      console.error(`🚨 [UPLOAD v6] ${warningMsg}`);
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
    
    console.log(`📤 [UPLOAD v6] Uploading to path with retry logic:`, fileName);
    console.log(`📤 [UPLOAD v6] Expected folder structure: ${resolved.propertyName}/${resolved.roomName}/${componentName || 'general'}`);
    
    // Upload to storage with retry logic (this now includes automatic retries)
    const publicUrl = await uploadBlobToStorage(blob, fileName);
    
    console.log(`✅ [UPLOAD v6] Upload successful with retries:`, publicUrl);
    
    // Verify the uploaded URL contains the correct folder structure
    if (publicUrl.includes(resolved.propertyName) && publicUrl.includes(resolved.roomName)) {
      console.log(`✅ [UPLOAD v6] Folder structure verified in URL!`);
    } else {
      console.error(`🚨 [UPLOAD v6] Folder structure NOT found in URL!`, {
        uploadedUrl: publicUrl,
        expectedProperty: resolved.propertyName,
        expectedRoom: resolved.roomName
      });
    }
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ [UPLOAD v6] Critical error in uploadReportImage after retries:`, error);
    
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
 * Enhanced upload multiple images using the new BatchUploadManager
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
    console.log(`🚀 [UPLOAD v6] uploadMultipleReportImages called with BatchUploadManager:`, {
      imageCount: imageUrls.length,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName
    });

    const batchManager = new BatchUploadManager(3, 100); // 3 concurrent, 100ms delay
    
    const result = await batchManager.uploadMultipleImages(
      imageUrls,
      reportId,
      roomId,
      propertyName,
      roomName,
      componentName,
      {
        maxConcurrent: 3,
        onProgress: (completed, total) => {
          console.log(`📊 [UPLOAD v6] Progress: ${completed}/${total} uploads completed`);
        },
        onBatchComplete: (batchIndex, totalBatches) => {
          console.log(`📦 [UPLOAD v6] Batch ${batchIndex}/${totalBatches} completed`);
        }
      }
    );

    console.log(`📊 [UPLOAD v6] Enhanced batch upload complete:`, {
      successful: result.uploadedUrls.length,
      failed: result.failedUploads.length,
      total: imageUrls.length,
      totalAttempts: result.totalAttempts,
      totalRetries: result.totalRetries
    });

    return result.uploadedUrls;
  } catch (error) {
    console.error(`❌ [UPLOAD v6] Critical error in batch upload:`, error);
    
    // Show enhanced error message for batch failures
    toast({
      title: "Batch Upload Failed",
      description: "Batch upload failed after automatic retries. Please check your connection and try again.",
      variant: "destructive",
    });
    
    return imageUrls;
  }
};
