
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { MultiPhotoAnalysisService } from "@/services/multiPhotoAnalysisService";
import { uploadReportImage } from "@/utils/supabaseStorage";
import { RoomImageAPI } from "@/lib/api/reports/roomImageApi";
import { ComponentAnalysisAPI } from "@/lib/api/reports/componentAnalysisApi";
import { BatchAnalysisProgress, ComponentStagingData } from "@/types";

interface EnhancedBatchConfig {
  reportId: string;
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  maxConcurrency?: number;
  enableCrossValidation?: boolean;
}

export function useEnhancedBatchAnalysis(config: EnhancedBatchConfig) {
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState<Map<string, BatchAnalysisProgress>>(new Map());
  const [globalProcessing, setGlobalProcessing] = useState(false);

  const processComponentBatch = useCallback(async (
    stagingData: ComponentStagingData
  ): Promise<any> => {
    const { componentId, componentName, stagedImages } = stagingData;
    const { reportId, roomId, roomType, propertyName, roomName, enableCrossValidation = true } = config;
    
    try {
      console.log(`🚀 Enhanced batch processing for ${componentName}: ${stagedImages.length} images`);
      
      // Validate image set
      const validation = MultiPhotoAnalysisService.validateImageSet(stagedImages);
      if (!validation.valid) {
        throw new Error(`Image validation failed: ${validation.issues.join(', ')}`);
      }
      
      // Update progress: uploading
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'uploading' as const,
        progress: 0,
        imageCount: stagedImages.length,
        processedImages: 0
      }));

      // Parallel upload all images
      const uploadPromises = stagedImages.map(async (imageUrl, index) => {
        const uploadedUrl = await uploadReportImage(
          imageUrl,
          reportId,
          roomId,
          propertyName || 'unknown_property',
          roomName || 'unknown_room',
          'component'
        );
        
        // Update progress for each upload
        setAnalysisProgress(prev => {
          const current = prev.get(componentId) || { status: 'uploading' as const, progress: 0 };
          return new Map(prev).set(componentId, {
            ...current,
            progress: Math.round((index + 1) / stagedImages.length * 40), // 40% for upload phase
            processedImages: index + 1
          });
        });
        
        return uploadedUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Save all images to database in single transaction
      const savedImages = await RoomImageAPI.addMultipleImagesToRoom(reportId, roomId, uploadedUrls);
      const imageIds = savedImages.map(img => img.id);

      // Update progress: analyzing
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'analyzing' as const,
        progress: 50,
        imageCount: stagedImages.length,
        processedImages: stagedImages.length
      }));

      // Enhanced multi-photo analysis
      const analysisResult = await MultiPhotoAnalysisService.processMultipleImages(
        uploadedUrls,
        roomType,
        componentName,
        {
          useAdvancedAnalysis: uploadedUrls.length > 1,
          crossValidation: enableCrossValidation && uploadedUrls.length > 1,
          consolidateFindings: true,
          maxImages: 10
        }
      );

      // Update component with enhanced analysis
      await ComponentAnalysisAPI.updateComponentWithAnalysis(
        reportId,
        roomId,
        componentId,
        analysisResult,
        imageIds
      );

      // Update progress: complete
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'complete' as const,
        progress: 100,
        imageCount: stagedImages.length,
        processedImages: stagedImages.length
      }));

      console.log(`✅ Enhanced analysis complete for ${componentName}`);
      
      return {
        componentId,
        analysisResult,
        uploadedUrls,
        imageIds,
        multiImageAnalysis: analysisResult.multiImageAnalysis
      };

    } catch (error) {
      console.error(`❌ Enhanced batch processing failed for ${componentName}:`, error);
      
      setAnalysisProgress(prev => new Map(prev).set(componentId, {
        status: 'error' as const,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        imageCount: stagedImages.length
      }));

      throw error;
    }
  }, [config]);

  const processBatchParallel = useCallback(async (
    componentBatches: ComponentStagingData[]
  ) => {
    const maxConcurrency = config.maxConcurrency || 2; // Reduced for enhanced processing
    const results: any[] = [];
    const errors: any[] = [];

    setGlobalProcessing(true);
    
    try {
      // Process in chunks with limited concurrency
      for (let i = 0; i < componentBatches.length; i += maxConcurrency) {
        const chunk = componentBatches.slice(i, i + maxConcurrency);
        
        const chunkPromises = chunk.map(async (stagingData) => {
          try {
            const result = await processComponentBatch(stagingData);
            results.push(result);
            return result;
          } catch (error) {
            errors.push({ componentId: stagingData.componentId, error });
            throw error;
          }
        });

        // Wait for current chunk to complete
        await Promise.allSettled(chunkPromises);
      }

      // Enhanced success reporting
      const totalImages = results.reduce((sum, r) => sum + (r.multiImageAnalysis?.imageCount || 0), 0);
      const successCount = results.length;
      const errorCount = errors.length;
      
      if (errorCount === 0) {
        toast({
          title: "Enhanced Multi-Photo Analysis Complete",
          description: `Successfully analyzed ${totalImages} images across ${successCount} components with cross-validation`,
        });
      } else {
        toast({
          title: "Enhanced Analysis Completed with Errors",
          description: `${successCount} components succeeded, ${errorCount} failed. ${totalImages} images processed.`,
          variant: "destructive",
        });
      }

      return { results, errors, totalImages };
    } finally {
      setGlobalProcessing(false);
    }
  }, [processComponentBatch, toast, config.maxConcurrency]);

  const resetProgress = useCallback(() => {
    setAnalysisProgress(new Map());
  }, []);

  return {
    analysisProgress,
    globalProcessing,
    processComponentBatch,
    processBatchParallel,
    resetProgress
  };
}
