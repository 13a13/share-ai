
import { supabase } from '@/integrations/supabase/client';
import { ConditionRating } from '@/types';

// Enhanced interface with unified system support
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
  // Analysis metadata from unified system
  analysisMetadata?: {
    imageCount: number;
    multiImageAnalysis: {
      isConsistent: boolean;
      consistencyScore: number;
      conflictingFindings: string[];
    };
    estimatedAge: string;
    // New fields for multi-component support
    itemCount?: number;
    sceneSummary?: string;
    multipleItems?: boolean;
  };
  analysisMode?: 'unified' | 'standard' | 'inventory' | 'advanced';
  // Enhanced processing metadata
  processingMetadata?: {
    modelUsed: string;
    costIncurred: number;
    processingTime: number;
    validationResult?: any;
    geminiModel?: string;
    enhancedProcessing?: boolean;
    unifiedSystem?: boolean;
    parsingMethod?: string;
    confidence?: number;
  };
  // New field for storing multiple component data
  components?: Array<{
    componentId: string;
    inferredType: string;
    description: string;
    condition: {
      rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      summary: string;
      points: string[];
    };
    cleanliness: string;
    estimatedAge: string;
  }>;
}

export const cleanlinessOptions = [
  { value: 'professional_clean', label: 'Professional Clean' },
  { value: 'professional_clean_with_omissions', label: 'Professional Clean with Omissions' },
  { value: 'domestic_clean_high_level', label: 'Domestic Clean to a High Level' },
  { value: 'domestic_clean', label: 'Domestic Clean' },
  { value: 'not_clean', label: 'Not Clean' }
];

// Updated condition rating options to match the enhanced prompt standards
export const conditionRatingOptions = [
  { value: 'excellent', label: 'Good Order', color: 'bg-green-500' },
  { value: 'good', label: 'Used Order', color: 'bg-blue-500' },
  { value: 'fair', label: 'Fair Order', color: 'bg-yellow-500' },
  { value: 'poor', label: 'Damaged', color: 'bg-red-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-700' }
];

/**
 * Convert condition rating to human-readable text
 */
export const conditionRatingToText = (condition: string): string => {
  const option = conditionRatingOptions.find(opt => opt.value === condition);
  return option ? option.label : condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Processes an image using the Unified Gemini System
 * Single prompt system that handles all scenarios with equal image weighting
 */
export const processComponentImage = async (
  imageUrls: string | string[],
  roomType: string,
  componentName: string,
  options: {
    multipleImages?: boolean;
    useAdvancedAnalysis?: boolean;
    propertyName?: string;
    roomName?: string;
  } = {}
): Promise<ProcessedImageResult> => {
  try {
    const imageArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    
    console.log(`🚀 [IMAGE PROCESSING v9] Processing ${imageArray.length} images with Unified Gemini System`);
    console.log(`📍 [IMAGE PROCESSING v9] Context: property="${options.propertyName}", room="${options.roomName}", component="${componentName}"`);
    
    const response = await supabase.functions.invoke('process-room-image', {
      body: {
        imageUrls: imageArray,
        componentName,
        roomType,
        // Enhanced context for better analysis
        propertyName: options.propertyName,
        roomName: options.roomName,
        // Unified system - no longer need mode flags
        unifiedSystem: true,
        imageCount: imageArray.length,
        enhancedFormatting: true
      },
    });

    if (response.error) {
      console.error('❌ [IMAGE PROCESSING v9] Error calling Unified Gemini System:', response.error);
      throw new Error('Failed to analyze image with Unified Gemini System');
    }

    const result = response.data as ProcessedImageResult;
    
    console.log(`✅ [IMAGE PROCESSING v9] Unified processing complete:`, {
      modelUsed: result.processingMetadata?.modelUsed,
      processingTime: result.processingMetadata?.processingTime,
      unifiedSystem: result.processingMetadata?.unifiedSystem,
      enhancedFormatting: result.processingMetadata?.enhancedProcessing,
      parsingMethod: result.processingMetadata?.parsingMethod
    });
    
    // Add unified system metadata
    result.analysisMode = 'unified';
    
    return result;
  } catch (error) {
    console.error('❌ [IMAGE PROCESSING v9] Error in unified system:', error);
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
 * Check if analysis result uses the unified format
 */
export const isUnifiedAnalysis = (result: ProcessedImageResult): boolean => {
  return Boolean(result.analysisMode === 'unified' || result.processingMetadata?.unifiedSystem);
};

/**
 * Check if analysis result uses the advanced format (legacy)
 */
export const isAdvancedAnalysis = (result: ProcessedImageResult): boolean => {
  return Boolean(result.analysisMode === 'advanced');
};
