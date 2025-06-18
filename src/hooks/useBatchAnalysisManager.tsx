
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { processComponentImage } from "@/services/imageProcessingService";
import { uploadReportImage } from "@/utils/supabaseStorage";
import { RoomImageAPI } from "@/lib/api/reports/roomImageApi";
import { ComponentAnalysisAPI } from "@/lib/api/reports/componentAnalysisApi";

interface BatchAnalysisConfig {
  reportId: string;
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  maxConcurrency?: number;
}

export function useBatchAnalysisManager(config: BatchAnalysisConfig) {
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState<Map<string, {
    status: 'pending' | 'uploading' | 'analyzing' | 'complete' | 'error';
    progress: number;
    error?: string;
  }>>(new Map());

  const processComponentBatch = useCallback(async (
    componentId: string,
    componentName: string,
    stagedImages: string[]
  ): Promise<any> => {
    const { reportId, roomId, roomType, propertyName, roomName } = config;
    
    try {
      // Update progress: uploading
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'uploading',
        progress: 0
      }));

      // Upload all images to storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < stagedImages.length; i++) {
        const imageUrl = stagedImages[i];
        const uploadedUrl = await uploadReportImage(
          imageUrl,
          reportId,
          roomId,
          propertyName || 'unknown_property',
          roomName || 'unknown_room',
          'component'
        );
        uploadedUrls.push(uploadedUrl);
        
        // Update upload progress
        setAnalysisProgress(prev => new Map(prev).set(componentId, {
          status: 'uploading',
          progress: Math.round((i + 1) / stagedImages.length * 50) // 50% for upload phase
        }));
      }

      // Save images to database
      const savedImages = await RoomImageAPI.addMultipleImagesToRoom(reportId, roomId, uploadedUrls);
      const imageIds = savedImages.map(img => img.id);

      // Update progress: analyzing
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'analyzing',
        progress: 50
      }));

      // Process with AI - single detailed prompt for all images
      const analysisResult = await processComponentImage(
        uploadedUrls,
        roomType,
        componentName,
        { 
          multipleImages: uploadedUrls.length > 1,
          useAdvancedAnalysis: uploadedUrls.length > 1
        }
      );

      // Update component in database
      await ComponentAnalysisAPI.updateComponentWithAnalysis(
        reportId,
        roomId,
        componentId,
        analysisResult,
        imageIds
      );

      // Update progress: complete
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'complete',
        progress: 100
      }));

      return {
        componentId,
        analysisResult,
        uploadedUrls,
        imageIds
      };

    } catch (error) {
      console.error(`❌ Error processing component ${componentName}:`, error);
      
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      throw error;
    }
  }, [config]);

  const processBatchParallel = useCallback(async (
    componentBatches: Array<{
      componentId: string;
      componentName: string;
      stagedImages: string[];
    }>
  ) => {
    const maxConcurrency = config.maxConcurrency || 3;
    const results: any[] = [];
    const errors: any[] = [];

    // Process in chunks with limited concurrency
    for (let i = 0; i < componentBatches.length; i += maxConcurrency) {
      const chunk = componentBatches.slice(i, i + maxConcurrency);
      
      const chunkPromises = chunk.map(async (batch) => {
        try {
          const result = await processComponentBatch(
            batch.componentId,
            batch.componentName,
            batch.stagedImages
          );
          results.push(result);
          return result;
        } catch (error) {
          errors.push({ componentId: batch.componentId, error });
          throw error;
        }
      });

      // Wait for current chunk to complete before processing next
      await Promise.allSettled(chunkPromises);
    }

    // Show summary toast
    const successCount = results.length;
    const errorCount = errors.length;
    
    if (errorCount === 0) {
      toast({
        title: "Batch Analysis Complete",
        description: `Successfully analyzed ${successCount} components`,
      });
    } else {
      toast({
        title: "Batch Analysis Completed with Errors",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: "destructive",
      });
    }

    return { results, errors };
  }, [processComponentBatch, toast, config.maxConcurrency]);

  const resetProgress = useCallback(() => {
    setAnalysisProgress(new Map());
  }, []);

  return {
    analysisProgress,
    processComponentBatch,
    processBatchParallel,
    resetProgress
  };
}
