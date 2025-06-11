
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutImageAnalysisResult {
  condition: {
    summary: string;
    points: string[];
    rating: string;
  };
  cleanliness: string;
  description: string;
  changesSinceCheckin: string;
  images: string[];
}

export const processCheckoutImages = async (
  imageUrls: string[],
  componentName: string,
  checkinData?: any
): Promise<CheckoutImageAnalysisResult> => {
  try {
    console.log('Processing checkout images:', { imageUrls, componentName, checkinData });

    // Use the same API structure as check-in reports
    const response = await supabase.functions.invoke('process-room-image', {
      body: { 
        imageUrls,
        componentName,
        roomType: 'checkout',
        inventoryMode: true,
        checkinData,
        maxSentences: 3 // Limit responses for checkout analysis
      },
    });

    if (response.error) {
      console.error('Error calling checkout image processing:', response.error);
      throw new Error('Failed to analyze checkout images');
    }

    // Transform the response to match checkout expectations
    const result = response.data;
    
    return {
      condition: result.condition || {
        summary: 'Analysis unavailable - please describe manually',
        points: [],
        rating: 'fair'
      },
      cleanliness: result.cleanliness || 'domestic_clean',
      description: result.description || 'Image analysis temporarily unavailable. Please provide manual assessment.',
      changesSinceCheckin: result.changesSinceCheckin || 'Unable to determine changes automatically',
      images: imageUrls
    };
  } catch (error) {
    console.error('Error in processCheckoutImages:', error);
    
    // Fallback analysis if AI service fails
    return {
      condition: {
        summary: 'Analysis unavailable - please describe manually',
        points: [],
        rating: 'fair'
      },
      cleanliness: 'domestic_clean',
      description: 'Image analysis temporarily unavailable. Please provide manual assessment.',
      changesSinceCheckin: 'Unable to determine changes automatically',
      images: imageUrls
    };
  }
};
