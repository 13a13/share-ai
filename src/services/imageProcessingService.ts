
import { useToast } from "@/components/ui/use-toast";

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
    const response = await fetch(`${window.location.origin}/supabase-functions/process-room-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        roomType,
        componentType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process image: ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
