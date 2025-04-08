
import { supabase } from "@/integrations/supabase/client";

export interface ProcessedImageResult {
  description?: string;
  condition?: {
    summary?: string;
    rating?: string;
  };
  notes?: string;
}

export const processComponentImage = async (
  imageUrls: string[] | string,
  roomType: string,
  componentType: string
): Promise<ProcessedImageResult> => {
  try {
    // Convert single image to array for consistent handling
    const images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    
    // Use supabase.functions.invoke to call the serverless function
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        imageUrls: images,
        roomType,
        componentType
      }
    });
    
    if (response.error) {
      console.error("Gemini API error:", response.error);
      throw new Error(`Failed to process image: ${response.error.message}`);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
