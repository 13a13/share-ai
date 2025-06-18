
/**
 * Enhanced Condition Types for Rich Assessment Display
 */

export interface EnhancedConditionDetails {
  structuralIntegrity: string;
  functionalPerformance: string;
  aestheticCondition: string;
  safetyAssessment: string;
}

export interface EnhancedConditionPoint {
  label: string;
  category?: 'structural' | 'functional' | 'aesthetic' | 'safety';
  severity?: 'minor' | 'moderate' | 'major' | 'critical';
  validationStatus?: 'confirmed' | 'unconfirmed';
  supportingImageCount?: number;
}

export interface EnhancedCondition {
  summary: string;
  points: (string | EnhancedConditionPoint)[];
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  details?: EnhancedConditionDetails;
}

export interface ComponentAnalysisData {
  description: string;
  condition: EnhancedCondition;
  cleanliness: string;
  analysisMetadata?: {
    imageCount: number;
    multiImageAnalysis: {
      isConsistent: boolean;
      consistencyScore: number;
      conflictingFindings: string[];
    };
    estimatedAge: string;
    itemCount?: number;
    sceneSummary?: string;
    multipleItems?: boolean;
  };
  processingMetadata?: {
    modelUsed: string;
    processingTime: number;
    parsingMethod: string;
    confidence: number;
    unifiedSystem?: boolean;
    enhancedFormatting?: boolean;
  };
  components?: Array<{
    componentId: string;
    inferredType: string;
    description: string;
    condition: EnhancedCondition;
    cleanliness: string;
    estimatedAge: string;
  }>;
}
