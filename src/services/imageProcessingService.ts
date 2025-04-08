
import { supabase } from "@/integrations/supabase/client";

export interface ProcessedImageResult {
  description?: string;
  condition?: string;
  notes?: string;
}

export const processComponentImage = async (
  imageUrl: string,
  roomType: string,
  componentType: string
): Promise<ProcessedImageResult> => {
  try {
    // Use supabase.functions.invoke instead of direct fetch
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        imageUrl,
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
