
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutImageAnalysisResult {
  condition: string;
  conditionSummary: string;
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

    const response = await supabase.functions.invoke('process-checkout-images', {
      body: { 
        imageUrls,
        componentName,
        checkinData,
        maxSentences: 3 // Limit responses for checkout analysis
      },
    });

    if (response.error) {
      console.error('Error calling checkout image processing:', response.error);
      throw new Error('Failed to analyze checkout images');
    }

    return response.data;
  } catch (error) {
    console.error('Error in processCheckoutImages:', error);
    
    // Fallback analysis if AI service fails
    return {
      condition: 'unknown',
      conditionSummary: 'Analysis unavailable - please describe manually',
      description: 'Image analysis temporarily unavailable. Please provide manual assessment.',
      changesSinceCheckin: 'Unable to determine changes automatically',
      images: imageUrls
    };
  }
};
