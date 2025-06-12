
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { uploadMultipleReportImages, checkStorageBucket } from "@/utils/supabaseStorage";
import { useUltraFastBatchSaving } from "./useUltraFastBatchSaving";

interface UseImageAnalysisProps {
  componentId: string;
  componentName: string;
  roomType: string;
  onImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (componentId: string, isProcessing: boolean) => void;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageAnalysis({
  componentId,
  componentName,
  roomType,
  onImagesProcessed,
  onProcessingStateChange,
  processComponentImage
}: UseImageAnalysisProps) {
  const { toast } = useToast();
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const { queueComponentUpdate, isSaving, getPendingCount } = useUltraFastBatchSaving();

  const processImages = async (stagingImages: string[]) => {
    if (!stagingImages || stagingImages.length === 0) return false;
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Get reportId and roomId from the DOM
      const reportElement = document.querySelector('[data-report-id]');
      const roomElement = document.querySelector('[data-room-id]');
      
      if (!reportElement || !roomElement) {
        console.error("Could not find report-id or room-id in DOM");
        throw new Error("Report or room ID not found");
      }
      
      const reportId = reportElement.getAttribute('data-report-id');
      const roomId = roomElement.getAttribute('data-room-id');
      
      if (!reportId || !roomId) {
        console.error("Invalid report-id or room-id in DOM");
        throw new Error("Invalid report or room ID");
      }
      
      console.log(`🚀 Processing ${stagingImages.length} images for component ${componentName}`);
      
      // Check if storage is available
      const storageAvailable = await checkStorageBucket();
      let storedImageUrls: string[] = stagingImages;
      
      if (storageAvailable) {
        try {
          // Upload all images to Supabase Storage in parallel
          storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
          console.log("Images uploaded to storage successfully");
        } catch (storageError) {
          console.warn("Storage upload failed, using original URLs:", storageError);
          storedImageUrls = stagingImages;
        }
      } else {
        console.warn("Storage bucket not available, using original image URLs");
      }
      
      // Process stored images with AI
      const result = await processComponentImage(storedImageUrls, roomType, componentName, true);
      
      // Queue the update for ultra-fast batch saving
      queueComponentUpdate(
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
      const storageStatus = storageAvailable ? "uploaded to storage" : "processed locally";
      toast({
        title: "Images processed",
        description: `AI analyzed ${stagingImages.length} image(s) and ${storageStatus}. ${pendingCount} queued for ultra-fast save.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still try to save the images
      try {
        const reportElement = document.querySelector('[data-report-id]');
        const roomElement = document.querySelector('[data-room-id]');
        
        if (reportElement && roomElement) {
          const reportId = reportElement.getAttribute('data-report-id');
          const roomId = roomElement.getAttribute('data-room-id');
          
          if (reportId && roomId) {
            const storageAvailable = await checkStorageBucket();
            let storedImageUrls = stagingImages;
            
            if (storageAvailable) {
              try {
                storedImageUrls = await uploadMultipleReportImages(stagingImages, reportId, roomId);
              } catch (storageError) {
                console.warn("Fallback storage upload failed:", storageError);
              }
            }
            
            onImagesProcessed(componentId, storedImageUrls, {
              description: "",
              condition: {
                summary: "",
                points: [],
                rating: "fair"
              },
              cleanliness: "domestic_clean",
              notes: "AI analysis failed - please add description manually"
            });
          }
        }
      } catch (uploadError) {
        console.error("Error uploading images after AI failure:", uploadError);
      }
      
      return false;
    } finally {
      onProcessingStateChange(componentId, false);
      setAnalysisInProgress(false);
    }
  };

  return {
    analysisInProgress: analysisInProgress || isSaving,
    processImages,
    pendingUpdatesCount: getPendingCount()
  };
}
