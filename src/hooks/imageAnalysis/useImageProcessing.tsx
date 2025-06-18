
import { ProcessedImageResult } from "@/services/imageProcessingService";

interface UseImageProcessingProps {
  componentId: string;
  componentName: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  processComponentImage: (imageUrls: string[], roomType: string, componentName: string, options: any) => Promise<ProcessedImageResult>;
}

export function useImageProcessing({
  componentId,
  componentName,
  roomType,
  propertyName,
  roomName,
  processComponentImage
}: UseImageProcessingProps) {

  const processImagesWithAI = async (imageUrls: string[]): Promise<ProcessedImageResult | null> => {
    console.log(`🤖 Step 4: Processing ${imageUrls.length} images with AI for component ${componentName}`);
    console.log(`📍 Context: property="${propertyName}", room="${roomName}"`);
    
    try {
      const result = await processComponentImage(
        imageUrls, 
        roomType, 
        componentName, 
        { 
          multipleImages: imageUrls.length > 1,
          propertyName,
          roomName
        }
      );
      
      console.log(`✅ AI processing complete for component ${componentId}:`, {
        description: result.description?.substring(0, 100) + '...',
        condition: result.condition?.rating,
        analysisMode: result.analysisMode,
        enhancedFormatting: result.processingMetadata?.enhancedProcessing
      });
      
      return result;
    } catch (error) {
      console.error(`❌ AI processing failed for component ${componentId}:`, error);
      throw error;
    }
  };

  return {
    processImagesWithAI
  };
}
