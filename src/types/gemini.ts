export interface UnifiedResponse {
  // Core analysis data
  description: string;
  condition: {
    summary: string;
    points: Array<{
      label: string;
      validationStatus?: 'confirmed' | 'unconfirmed';
      supportingImageCount?: number;
    }>;
    rating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  cleanliness: string;
  
  // Enhanced analysis fields
  materialConsistency?: {
    isConsistent: boolean;
    variations: string[];
    confidence: 'low' | 'medium' | 'high';
  };
  
  defectAnalysis?: {
    defectsFound: Array<{
      type: string;
      severity: 'minor' | 'moderate' | 'major';
      location: string;
      confidence: 'low' | 'medium' | 'high';
    }>;
    overallConfidence: 'low' | 'medium' | 'high';
  };
  
  crossImageValidation?: {
    consistentFindings: string[];
    conflictingFindings: string[];
    multiAngleValidation: Array<{
      finding: string;
      supportingImageCount: number;
    }>;
  };
  
  // Metadata
  analysisMode: 'standard' | 'inventory' | 'advanced';
  imageCount: number;
  processingNotes?: string[];
  
  // Legacy compatibility
  notes?: string;
  rating?: string;
}

// Keep existing interface for backward compatibility
export interface GeminiResponse {
  objects: {
    name: string;
    condition: string;
    description: string;
  }[];
  roomAssessment: {
    generalCondition: string;
    walls: string;
    ceiling: string;
    flooring: string;
    doors: string;
    windows: string;
    lighting: string;
    furniture?: string;
    appliances?: string;
    additional?: string;
    cleaning: string;
  };
}
