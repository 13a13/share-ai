
export interface MultiPhotoPromptConfig {
  componentName: string;
  roomType: string;
  imageCount: number;
  crossValidation: boolean;
  consolidateFindings: boolean;
}

export const EnhancedMultiPhotoProcessor = {
  /**
   * Generate enhanced prompt for multi-photo analysis
   */
  generateMultiPhotoPrompt: (config: MultiPhotoPromptConfig): string => {
    const { componentName, roomType, imageCount, crossValidation, consolidateFindings } = config;
    
    return `You are analyzing ${imageCount} images of a ${componentName} in a ${roomType}. 

MULTI-IMAGE ANALYSIS INSTRUCTIONS:
1. Examine ALL ${imageCount} images comprehensively
2. Cross-reference findings between images to ensure consistency
3. Identify any conflicting information between images
4. Provide a consolidated analysis that represents the most accurate assessment

${crossValidation ? `
CROSS-VALIDATION REQUIREMENTS:
- Compare condition assessments across all images
- Note any inconsistencies in damage, wear, or cleanliness
- Provide confidence scores for each finding
- Flag any contradictory evidence between images
` : ''}

${consolidateFindings ? `
CONSOLIDATED REPORTING:
- Merge similar findings from multiple angles
- Prioritize the most severe condition found across all images
- Create a unified condition summary that reflects the overall state
- List specific details that were confirmed across multiple images
` : ''}

ENHANCED OUTPUT FORMAT:
{
  "description": "Comprehensive description based on all ${imageCount} images",
  "condition": {
    "summary": "Overall condition assessment from multiple angles",
    "points": ["Specific findings confirmed across images"],
    "rating": "Most accurate condition rating from all images",
    "crossImageValidation": ${crossValidation}
  },
  "cleanliness": "Cleanliness assessment from all angles",
  "multiImageAnalysis": {
    "imageCount": ${imageCount},
    "consistencyScore": 0.0-1.0,
    "conflictingFindings": ["Any inconsistencies between images"],
    "consolidatedFindings": ["Findings confirmed across multiple images"]
  },
  "analysisMetadata": {
    "processingMode": "multi",
    "aiModel": "gemini-2.0-flash",
    "processingTime": 0
  }
}

Analyze the ${componentName} thoroughly using all ${imageCount} images provided.`;
  },

  /**
   * Validate multi-photo analysis result
   */
  validateMultiPhotoResult: (result: any, expectedImageCount: number): boolean => {
    if (!result.multiImageAnalysis) return false;
    if (result.multiImageAnalysis.imageCount !== expectedImageCount) return false;
    if (typeof result.multiImageAnalysis.consistencyScore !== 'number') return false;
    if (!Array.isArray(result.multiImageAnalysis.consolidatedFindings)) return false;
    
    return true;
  }
};
