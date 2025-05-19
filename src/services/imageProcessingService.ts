
import { supabase } from '@/integrations/supabase/client';
import { ConditionRating } from '@/types';

// Enhanced interface with cross-analysis support
export interface ProcessedImageResult {
  description: string;
  condition: {
    summary: string;
    points: string[] | Array<{
      label: string;
      validationStatus?: 'confirmed' | 'unconfirmed';
      supportingImageCount?: number;
    }>;
    rating: ConditionRating;
  };
  cleanliness: string;
  rating?: string; // The original rating from Gemini
  notes?: string;
  // Advanced analysis fields
  crossAnalysis?: {
    materialConsistency: boolean | null;
    defectConfidence: 'low' | 'medium' | 'high';
    multiAngleValidation: Array<[string, number]>;
  };
  analysisMode?: 'standard' | 'inventory' | 'advanced';
}

export const cleanlinessOptions = [
  { value: 'professional_clean', label: 'Professional Clean' },
  { value: 'professional_clean_with_omissions', label: 'Professional Clean with Omissions' },
  { value: 'domestic_clean_high_level', label: 'Domestic Clean to a High Level' },
  { value: 'domestic_clean', label: 'Domestic Clean' },
  { value: 'not_clean', label: 'Not Clean' }
];

export const conditionRatingOptions = [
  { value: 'excellent', label: 'Good Order', color: 'bg-green-500' },
  { value: 'good', label: 'Used Order', color: 'bg-blue-500' },
  { value: 'fair', label: 'Fair Order', color: 'bg-yellow-500' },
  { value: 'poor', label: 'Damaged', color: 'bg-red-500' }
];

/**
 * Convert condition rating to human-readable text
 * @param condition Condition rating from the enum
 * @returns Formatted text representation
 */
export const conditionRatingToText = (condition: string): string => {
  const option = conditionRatingOptions.find(opt => opt.value === condition);
  return option ? option.label : condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Processes an image using the Gemini API to analyze a component
 * @param imageUrls URL or array of URLs of the image(s) to analyze
 * @param roomType Type of room the component is in
 * @param componentName Name of the component being analyzed
 * @param options Additional options for processing
 * @returns Processed image result with description, condition, cleanliness and other details
 */
export const processComponentImage = async (
  imageUrls: string | string[],
  roomType: string,
  componentName: string,
  options: {
    multipleImages?: boolean;
    useAdvancedAnalysis?: boolean; // New option to enable advanced analysis
  } = {}
): Promise<ProcessedImageResult> => {
  try {
    const { multipleImages = false, useAdvancedAnalysis = false } = options;
    console.log(`Processing ${Array.isArray(imageUrls) ? imageUrls.length : 1} images for component: ${componentName}`);
    
    // Only enable advanced analysis for multiple images
    const shouldUseAdvancedAnalysis = useAdvancedAnalysis && 
                                      Array.isArray(imageUrls) && 
                                      imageUrls.length > 1;
    
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        imageUrls,
        componentName,
        roomType,
        inventoryMode: !shouldUseAdvancedAnalysis && true, // Use inventory mode when not using advanced
        useAdvancedAnalysis: shouldUseAdvancedAnalysis,
        multipleImages
      },
    });

    if (response.error) {
      console.error('Error calling Gemini API:', response.error);
      throw new Error('Failed to analyze image');
    }

    const result = response.data as ProcessedImageResult;
    
    // Add analysis mode for frontend rendering decisions if not already set
    if (!result.analysisMode) {
      result.analysisMode = shouldUseAdvancedAnalysis ? 'advanced' : 'inventory';
    }
    
    return result;
  } catch (error) {
    console.error('Error in processComponentImage:', error);
    throw error;
  }
};

/**
 * Normalize and standardize condition points to handle both string arrays
 * and structured object arrays with validation data
 */
export const normalizeConditionPoints = (points: any[]): string[] => {
  if (!points || !Array.isArray(points)) return [];
  
  return points.map(point => {
    if (typeof point === 'string') {
      return point;
    } else if (typeof point === 'object' && point !== null) {
      // If it's an enhanced point with validation data, just return the label
      return point.label || '';
    }
    return '';
  }).filter(Boolean);
};

/**
 * Check if analysis result uses the advanced format
 */
export const isAdvancedAnalysis = (result: ProcessedImageResult): boolean => {
  return Boolean(result.analysisMode === 'advanced' || result.crossAnalysis);
};
