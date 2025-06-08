
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";
import { uploadReportImage } from "@/utils/supabaseStorage";
import { useOptimizedImageSaving } from "./useOptimizedImageSaving";

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
  const { saveComponentAnalysisBatch } = useOptimizedImageSaving();

  const processImages = async (stagingImages: string[]) => {
    if (!stagingImages || stagingImages.length === 0) return false;
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // First, get reportId and roomId from the DOM
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
      
      // Upload all images to Supabase Storage in parallel
      const uploadPromises = stagingImages.map(imageUrl => 
        uploadReportImage(imageUrl, reportId, roomId)
      );
      const storedImageUrls = await Promise.all(uploadPromises);
      
      // Process stored images with AI
      const result = await processComponentImage(storedImageUrls, roomType, componentName, true);
      
      // Use batch saving for better performance
      const saveSuccess = await saveComponentAnalysisBatch(reportId, [{
        id: componentId,
        images: storedImageUrls,
        description: result.description || "",
        condition: result.condition || { summary: "", points: [], rating: "fair" },
        analysisData: result
      }]);
      
      if (saveSuccess) {
        onImagesProcessed(componentId, storedImageUrls, result);
        
        toast({
          title: "Images processed successfully",
          description: `AI has analyzed ${stagingImages.length} ${stagingImages.length === 1 ? 'image' : 'images'} for ${componentName}`,
        });
      }
      
      return saveSuccess;
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the images without AI data
      try {
        const reportElement = document.querySelector('[data-report-id]');
        const roomElement = document.querySelector('[data-room-id]');
        
        if (reportElement && roomElement) {
          const reportId = reportElement.getAttribute('data-report-id');
          const roomId = roomElement.getAttribute('data-room-id');
          
          if (reportId && roomId) {
            // Upload images to Supabase Storage even if AI fails
            const uploadPromises = stagingImages.map(imageUrl => 
              uploadReportImage(imageUrl, reportId, roomId)
            );
            const storedImageUrls = await Promise.all(uploadPromises);
            
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
    analysisInProgress,
    processImages
  };
}
