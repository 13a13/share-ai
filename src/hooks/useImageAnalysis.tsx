
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessedImageResult } from "@/services/imageProcessingService";

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

  const processImages = async (stagingImages: string[]) => {
    if (stagingImages.length === 0) return;
    
    onProcessingStateChange(componentId, true);
    setAnalysisInProgress(true);
    
    try {
      // Process all images together with the component name
      const result = await processComponentImage(stagingImages, roomType, componentName, true);
      onImagesProcessed(componentId, stagingImages, result);
      
      toast({
        title: "Images processed successfully",
        description: `AI has analyzed ${stagingImages.length} ${stagingImages.length === 1 ? 'image' : 'images'} for ${componentName}`,
      });
      return true;
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error processing images",
        description: "AI analysis failed. Please try again or check your internet connection.",
        variant: "destructive",
      });
      
      // Even if AI fails, still add the images without AI data
      onImagesProcessed(componentId, stagingImages, {
        description: "",
        condition: {
          summary: "",
          points: [],
          rating: "fair"
        },
        cleanliness: "domestic_clean",
        notes: "AI analysis failed - please add description manually"
      });
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
