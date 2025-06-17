
/**
 * Core image processing logic separated from storage operations
 */

import { useState } from "react";
import { ProcessedImageResult } from "@/services/imageProcessingService";

interface UseImageProcessingProps {
  componentId: string;
  componentName: string;
  roomType: string;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, multipleImages: boolean) => Promise<ProcessedImageResult>;
}

export function useImageProcessing({
  componentId,
  componentName,
  roomType,
  processComponentImage
}: UseImageProcessingProps) {
  const [analysisInProgress, setAnalysisInProgress] = useState(false);

  const processImagesWithAI = async (imageUrls: string[]): Promise<ProcessedImageResult | null> => {
    if (!imageUrls || imageUrls.length === 0) return null;

    console.log(`🤖 Step 4: Processing images with AI...`);
    setAnalysisInProgress(true);
    
    try {
      const result = await processComponentImage(imageUrls, roomType, componentName, true);
      console.log("✅ AI processing completed:", result);
      return result;
    } catch (error) {
      console.error("❌ AI processing failed:", error);
      throw error;
    } finally {
      setAnalysisInProgress(false);
    }
  };

  return {
    analysisInProgress,
    processImagesWithAI
  };
}
