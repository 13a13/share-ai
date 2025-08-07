
import { withRetry, BATCH_RETRY_CONFIG, RetryContext } from './retryUtils';
import { uploadReportImage } from './imageUploadUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';
import { toast } from "@/components/ui/use-toast";

export interface BatchUploadOptions {
  maxConcurrent?: number;
  onProgress?: (completed: number, total: number) => void;
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void;
}

export interface BatchUploadResult {
  uploadedUrls: string[];
  failedUploads: string[];
  totalAttempts: number;
  totalRetries: number;
}

/**
 * Enhanced batch upload manager with controlled concurrency and progress tracking
 */
export class BatchUploadManager {
  private maxConcurrent: number;
  private batchDelay: number;

  constructor(maxConcurrent: number = 3, batchDelay: number = 100) {
    this.maxConcurrent = maxConcurrent;
    this.batchDelay = batchDelay;
  }

  async uploadMultipleImages(
    imageUrls: string[],
    reportId: string,
    roomId: string,
    propertyName?: string,
    roomName?: string,
    componentName?: string,
    options: BatchUploadOptions = {}
  ): Promise<BatchUploadResult> {
    const { maxConcurrent = this.maxConcurrent, onProgress, onBatchComplete } = options;
    
    console.log(`🚀 [BATCH v6] Starting enhanced batch upload for ${imageUrls.length} images`);
    
    // Resolve names once for all uploads to optimize performance
    const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
    console.log(`✅ [BATCH v6] Names resolved once for all uploads:`, resolved);
    
    const dataUrls = imageUrls.filter(url => url.startsWith('data:'));
    const existingUrls = imageUrls.filter(url => !url.startsWith('data:'));
    
    if (dataUrls.length === 0) {
      return {
        uploadedUrls: imageUrls,
        failedUploads: [],
        totalAttempts: 0,
        totalRetries: 0
      };
    }
    
    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];
    let totalAttempts = 0;
    let totalRetries = 0;
    
    // Process in controlled batches to prevent memory exhaustion
    const totalBatches = Math.ceil(dataUrls.length / maxConcurrent);
    
    for (let i = 0; i < dataUrls.length; i += maxConcurrent) {
      const batchIndex = Math.floor(i / maxConcurrent);
      const batch = dataUrls.slice(i, i + maxConcurrent);
      
      console.log(`📦 [BATCH v6] Processing batch ${batchIndex + 1}/${totalBatches} with ${batch.length} images`);
      
      const batchPromises = batch.map(async (dataUrl, batchImageIndex) => {
        const globalIndex = i + batchImageIndex;
        totalAttempts++;
        
        try {
          const result = await withRetry(
            () => uploadReportImage(
              dataUrl, 
              reportId, 
              roomId, 
              resolved.propertyName as string, 
              resolved.roomName as string, 
              componentName
            ),
            BATCH_RETRY_CONFIG,
            (context: RetryContext) => {
              if (context.attempt > 1) {
                totalRetries++;
                console.log(`🔄 [BATCH v6] Image ${globalIndex + 1} retry ${context.attempt - 1}`);
              }
            }
          );
          
          return { 
            success: true, 
            url: result, 
            originalIndex: globalIndex 
          };
        } catch (error) {
          console.error(`❌ [BATCH v6] Failed to upload image ${globalIndex + 1} after retries:`, error);
          return { 
            success: false, 
            url: dataUrl, 
            originalIndex: globalIndex 
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, batchImageIndex) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            uploadedUrls.push(result.value.url);
          } else {
            failedUploads.push(result.value.url);
          }
        } else {
          failedUploads.push(batch[batchImageIndex]);
        }
      });
      
      // Report progress
      onProgress?.(uploadedUrls.length, dataUrls.length);
      onBatchComplete?.(batchIndex + 1, totalBatches);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + maxConcurrent < dataUrls.length) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }
    
    const finalResult = {
      uploadedUrls: [...existingUrls, ...uploadedUrls],
      failedUploads,
      totalAttempts,
      totalRetries
    };
    
    console.log(`📊 [BATCH v6] Enhanced batch upload complete:`, {
      successful: uploadedUrls.length,
      failed: failedUploads.length,
      total: dataUrls.length,
      totalAttempts,
      totalRetries,
      batches: totalBatches
    });
    
    // Enhanced completion notification
    if (uploadedUrls.length > 0) {
      toast({
        title: "Batch Upload Complete",
        description: `${uploadedUrls.length}/${dataUrls.length} images uploaded successfully${totalRetries > 0 ? ` (${totalRetries} automatic retries)` : ''} in ${totalBatches} batches`,
      });
    }
    
    return finalResult;
  }
}

/**
 * Enhanced uploadMultipleReportImages with controlled concurrency
 */
export const uploadMultipleReportImages = async (
  imageUrls: string[],
  reportId: string,
  roomId: string,
  propertyName?: string,
  roomName?: string,
  componentName?: string,
  options: BatchUploadOptions = {}
): Promise<string[]> => {
  const manager = new BatchUploadManager();
  const result = await manager.uploadMultipleImages(
    imageUrls,
    reportId,
    roomId,
    propertyName,
    roomName,
    componentName,
    options
  );
  
  return result.uploadedUrls;
};
