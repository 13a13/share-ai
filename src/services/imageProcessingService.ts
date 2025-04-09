
import { supabase } from "@/integrations/supabase/client";

export interface CleanlinessRating {
  value: string;
  label: string;
}

export interface ConditionRating {
  value: string;
  label: string;
}

export interface ProcessedImageResult {
  description?: string;
  condition?: {
    summary?: string;
    points?: string[];
    rating?: string;
  };
  cleanliness?: string;
  rating?: string;
  notes?: string;
}

export const cleanlinessOptions: CleanlinessRating[] = [
  { value: 'professional_clean', label: 'Professional Clean' },
  { value: 'professional_clean_with_omissions', label: 'Professional Clean with Omissions' },
  { value: 'domestic_clean_high_level', label: 'Domestic Clean to a High Level' },
  { value: 'domestic_clean', label: 'Domestic Clean' },
  { value: 'not_clean', label: 'Not Clean' }
];

export const conditionRatingOptions: ConditionRating[] = [
  { value: 'good_order', label: 'Good Order' },
  { value: 'used_order', label: 'Used Order' },
  { value: 'fair_order', label: 'Fair Order' },
  { value: 'damaged', label: 'Damaged' }
];

export const processComponentImage = async (
  imageUrls: string[] | string,
  roomType: string,
  componentName: string,
  inventoryMode: boolean = true
): Promise<ProcessedImageResult> => {
  try {
    // Convert single image to array for consistent handling
    const images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    
    console.log(`Processing ${images.length} images for component: ${componentName}`);
    
    // Use supabase.functions.invoke to call the serverless function
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        imageUrls: images,
        roomType,
        componentName,
        inventoryMode,
        maxImages: 20 // Limit to 20 images max
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

// Helper function to test if Gemini API is configured correctly
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    // Call the test endpoint with a simple request
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        test: true
      }
    });
    
    if (response.error) {
      console.error("Gemini API connection test failed:", response.error);
      return false;
    }
    
    return response.data?.configured === true;
  } catch (error) {
    console.error("Error testing Gemini API connection:", error);
    return false;
  }
};
