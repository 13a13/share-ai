
import { UnifiedResponse } from '../../../src/types/gemini.ts';

export function parseUnifiedResponse(textContent: string, componentName?: string): UnifiedResponse {
  try {
    // First, try to extract JSON from the text
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize the response
    const unifiedResponse: UnifiedResponse = {
      description: parsedData.description || `Analysis of ${componentName || 'component'}`,
      condition: {
        summary: parsedData.condition?.summary || 'No condition summary provided',
        points: normalizeConditionPoints(parsedData.condition?.points || []),
        rating: validateConditionRating(parsedData.condition?.rating || 'fair')
      },
      cleanliness: validateCleanliness(parsedData.cleanliness || 'domestic_clean'),
      analysisMode: parsedData.analysisMode || 'standard',
      imageCount: parsedData.imageCount || 1,
      processingNotes: parsedData.processingNotes || []
    };
    
    // Add enhanced fields if present
    if (parsedData.materialConsistency) {
      unifiedResponse.materialConsistency = parsedData.materialConsistency;
    }
    
    if (parsedData.defectAnalysis) {
      unifiedResponse.defectAnalysis = parsedData.defectAnalysis;
    }
    
    if (parsedData.crossImageValidation) {
      unifiedResponse.crossImageValidation = parsedData.crossImageValidation;
    }
    
    // Add legacy compatibility fields
    unifiedResponse.notes = parsedData.notes;
    unifiedResponse.rating = parsedData.condition?.rating;
    
    return unifiedResponse;
    
  } catch (parseError) {
    console.error('Failed to parse unified response:', parseError);
    
    // Fallback: try to extract meaningful content from text
    return createFallbackUnifiedResponse(textContent, componentName);
  }
}

function normalizeConditionPoints(points: any[]): Array<{
  label: string;
  validationStatus?: 'confirmed' | 'unconfirmed';
  supportingImageCount?: number;
}> {
  if (!Array.isArray(points)) return [];
  
  return points.map(point => {
    if (typeof point === 'string') {
      return { label: point };
    } else if (typeof point === 'object' && point !== null) {
      return {
        label: point.label || point.toString(),
        validationStatus: point.validationStatus,
        supportingImageCount: point.supportingImageCount
      };
    }
    return { label: point?.toString() || '' };
  }).filter(point => point.label.length > 0);
}

function validateConditionRating(rating: string): 'excellent' | 'good' | 'fair' | 'poor' {
  const validRatings = ['excellent', 'good', 'fair', 'poor'];
  const normalizedRating = rating.toLowerCase().trim();
  
  if (validRatings.includes(normalizedRating)) {
    return normalizedRating as 'excellent' | 'good' | 'fair' | 'poor';
  }
  
  // Map common alternatives
  if (normalizedRating.includes('new') || normalizedRating.includes('perfect')) return 'excellent';
  if (normalizedRating.includes('minor') || normalizedRating.includes('slight')) return 'good';
  if (normalizedRating.includes('moderate') || normalizedRating.includes('some')) return 'fair';
  if (normalizedRating.includes('major') || normalizedRating.includes('significant')) return 'poor';
  
  return 'fair'; // Default fallback
}

function validateCleanliness(cleanliness: string): string {
  const validOptions = [
    'professional_clean',
    'professional_clean_with_omissions',
    'domestic_clean_high_level',
    'domestic_clean',
    'not_clean'
  ];
  
  const normalized = cleanliness.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  if (validOptions.includes(normalized)) {
    return normalized;
  }
  
  // Map common alternatives
  if (normalized.includes('professional') || normalized.includes('spotless')) {
    return 'professional_clean';
  }
  if (normalized.includes('very_clean') || normalized.includes('high')) {
    return 'domestic_clean_high_level';
  }
  if (normalized.includes('dirty') || normalized.includes('unclean')) {
    return 'not_clean';
  }
  
  return 'domestic_clean'; // Default fallback
}

function createFallbackUnifiedResponse(textContent: string, componentName?: string): UnifiedResponse {
  console.log('Creating fallback unified response');
  
  return {
    description: `Analysis of ${componentName || 'component'} - AI processing failed`,
    condition: {
      summary: 'Manual review required',
      points: [{ label: 'AI analysis failed - please add description manually' }],
      rating: 'fair'
    },
    cleanliness: 'domestic_clean',
    analysisMode: 'standard',
    imageCount: 1,
    processingNotes: ['AI parsing failed', 'Fallback response generated'],
    notes: 'AI analysis failed - please add description manually'
  };
}

// Legacy parser fallback for backward compatibility
export function parseLegacyInventoryResponse(textContent: string): any {
  // This is kept for backward compatibility but should redirect to unified parser
  console.log('Legacy parser called - redirecting to unified parser');
  return parseUnifiedResponse(textContent);
}
