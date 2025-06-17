
/**
 * Main image analysis hook - refactored into smaller focused modules
 */

import { useToast } from "@/hooks/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { useImageProcessing } from "./imageAnalysis/useImageProcessing";
import { useImageStorage } from "./imageAnalysis/useImageStorage";
import { useImageAnalysisState } from "./imageAnalysis/useImageAnalysisState";

interface UseImageAnalysisProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageAnalysis({
  componentId,
  componentName,
  roomType,
  propertyName,
  roomName,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageAnalysisProps) {
  const { toast } = useToast();
  
  // Use focused hooks for specific functionality
  const { processImagesWithAI } = useImageProcessing({
    componentId,
    componentName,
    roomType,
    processComponentImage
  });

  const { resolvedNames, uploadAndStoreImages } = useImageStorage({
    propertyName,
    roomName
  });

  const { 
    analysisInProgress, 
    updateAnalysisState, 
    queueUpdate, 
    getPendingCount 
  } = useImageAnalysisState();

  const processImages = async (stagingImages: string[]) => {
    if (!stagingImages || stagingImages.length === 0) return false;
    if (!resolvedNames) {
      console.error("❌ Cannot process images: names not resolved yet");
      return false;
    }

    const reportElement = document.querySelector('[data-report-id]');
    const reportId = reportElement?.getAttribute('data-report-id');

    console.log(`🚀 Starting image analysis for ${stagingImages.length} images in component ${componentName} for property: ${resolvedNames.propertyName}, room: ${resolvedNames.roomName}`);
    
    onProcessingStateChange(componentId, true);
    updateAnalysisState(componentId, true);
    
    try {
      if (!reportElement) {
        throw new Error("Report ID not found");
      }
      
      console.log(`📍 Processing images for report: ${reportId}, component: ${componentId}, property: ${resolvedNames.propertyName}, roomName: ${resolvedNames.roomName}, componentName: ${componentName}`);
      
      // Upload and store images
      const storedImageUrls = await uploadAndStoreImages(stagingImages, componentName);
      
      // Process images with AI
      const result = await processImagesWithAI(storedImageUrls);
      
      if (!result) {
        throw new Error("AI processing failed");
      }
      
      // Queue the update for ultra-fast batch saving
      console.log("⚡ Step 5: Queueing component update...");
      queueUpdate(
        reportId,
        componentId,
        storedImageUrls,
        result.description || "",
        result.condition || { summary: "", points: [], rating: "fair" },
        result
      );
      
      // Update UI immediately
      onImagesProcessed(componentId, storedImageUrls, result);
      
      const pendingCount = getPendingCount();
      const successfulUploads = storedImageUrls.filter(url => !url.startsWith('data:')).length;
      
      console.log(`🎉 Processing complete: ${stagingImages.length} images analyzed, ${successfulUploads} uploaded to ${resolvedNames.propertyName}/${resolvedNames.roomName}/${componentName}, ${pendingCount} updates queued`);
      
      // Show success message
      toast({
        title: "Images processed successfully",
        description: `AI analyzed ${stagingImages.length} image(s) and uploaded ${successfulUploads} to ${resolvedNames.propertyName}/${resolvedNames.roomName}/${componentName}. ${pendingCount} updates queued for saving.`,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error in image processing pipeline:", error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Report or room ID")) {
          errorMessage = "Could not identify the current report and room. Please refresh the page.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error processing images",
        description: `Failed to process images: ${errorMessage}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      onProcessingStateChange(componentId, false);
      updateAnalysisState(componentId, false);
    }
  };

  return {
    analysisInProgress,
    processImages,
    pendingUpdatesCount: getPendingCount()
  };
}
