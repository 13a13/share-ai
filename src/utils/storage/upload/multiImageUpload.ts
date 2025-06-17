
/**
 * Multiple image upload functionality using BatchUploadManager
 */

import { BatchUploadManager, type BatchUploadOptions } from '../batchUploadManager';
import { toast } from "@/hooks/use-toast";

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
    
    toast({
      title: "Batch Upload Failed",
      description: "Batch upload failed after automatic retries. Please check your connection and try again.",
      variant: "destructive",
    });
    
    return imageUrls;
  }
};
