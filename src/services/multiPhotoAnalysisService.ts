
import { supabase } from '@/integrations/supabase/client';
import { MultiPhotoAnalysisResult, ConditionRating } from '@/types';

export interface MultiPhotoProcessingOptions {
  useAdvancedAnalysis: boolean;
  crossValidation: boolean;
  consolidateFindings: boolean;
  maxImages: number;
}

export const MultiPhotoAnalysisService = {
  /**
   * Process multiple images for a single component with enhanced context
   */
  processMultipleImages: async (
    imageUrls: string[],
    roomType: string,
    componentName: string,
    options: MultiPhotoProcessingOptions = {
      useAdvancedAnalysis: true,
      crossValidation: true,
      consolidateFindings: true,
      maxImages: 10
    }
  ): Promise<MultiPhotoAnalysisResult> => {
    console.log(`🔄 Processing ${imageUrls.length} images for ${componentName} with advanced multi-photo analysis`);
    
    try {
      const response = await supabase.functions.invoke('process-room-image', {
        body: {
          imageUrls: imageUrls.slice(0, options.maxImages),
          componentName,
          roomType,
          multipleImages: true,
          useAdvancedAnalysis: options.useAdvancedAnalysis,
          crossValidation: options.crossValidation,
          consolidateFindings: options.consolidateFindings,
          processingMode: 'multi-photo-enhanced'
        },
      });

      if (response.error) {
        console.error('❌ Multi-photo analysis error:', response.error);
        throw new Error('Failed to analyze multiple images');
      }

      const result = response.data as MultiPhotoAnalysisResult;
      
      // Ensure proper structure
      return {
        ...result,
        multiImageAnalysis: {
          imageCount: imageUrls.length,
          consistencyScore: result.multiImageAnalysis?.consistencyScore || 0.8,
          conflictingFindings: result.multiImageAnalysis?.conflictingFindings || [],
          consolidatedFindings: result.multiImageAnalysis?.consolidatedFindings || []
        },
        analysisMetadata: {
          processingMode: 'multi',
          aiModel: result.analysisMetadata?.aiModel || 'gemini-2.0-flash',
          processingTime: result.analysisMetadata?.processingTime || 0
        }
      };
    } catch (error) {
      console.error('❌ Error in multi-photo analysis:', error);
      throw error;
    }
  },

  /**
   * Validate image compatibility for multi-photo analysis
   */
  validateImageSet: (imageUrls: string[]): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (imageUrls.length === 0) {
      issues.push('No images provided');
    }
    
    if (imageUrls.length > 10) {
      issues.push('Too many images (max 10)');
    }
    
    // Check for data URLs vs storage URLs
    const hasDataUrls = imageUrls.some(url => url.startsWith('data:'));
    const hasStorageUrls = imageUrls.some(url => !url.startsWith('data:'));
    
    if (hasDataUrls && hasStorageUrls) {
      issues.push('Mixed data URLs and storage URLs not allowed');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
};
