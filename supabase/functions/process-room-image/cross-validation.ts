
export interface ValidationResult {
  isConsistent: boolean;
  confidence: 'low' | 'medium' | 'high';
  discrepancies: string[];
  recommendedAction: 'accept' | 'review' | 'retake';
  validationScore: number;
}

export interface ImageMetadata {
  lighting: string;
  angle: string;
  timestamp: number;
  quality?: string;
}

export class CrossImageValidator {
  private maxValidationImages = 5; // Limit to prevent performance issues
  private confidenceThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  };

  async validateAcrossImages(
    analyses: any[],
    imageMetadata: ImageMetadata[]
  ): Promise<ValidationResult> {
    console.log(`🔍 [CROSS VALIDATION] Starting validation across ${analyses.length} analyses`);
    
    // Limit validation to prevent performance issues
    const analysesToValidate = analyses.slice(0, this.maxValidationImages);
    const metadataToValidate = imageMetadata.slice(0, this.maxValidationImages);
    
    const validationResults = {
      materialConsistency: this.validateMaterialConsistency(analysesToValidate),
      conditionConsistency: this.validateConditionConsistency(analysesToValidate),
      cleanlinessConsistency: this.validateCleanlinessConsistency(analysesToValidate),
      lightingAdjustment: this.adjustForLightingDifferences(analysesToValidate, metadataToValidate),
      temporalConsistency: this.validateTemporalConsistency(analysesToValidate, metadataToValidate)
    };
    
    const overallConfidence = this.calculateOverallConfidence(validationResults);
    const discrepancies = this.identifyDiscrepancies(validationResults);
    const validationScore = this.calculateValidationScore(validationResults);
    
    const result: ValidationResult = {
      isConsistent: discrepancies.length < 2 && validationScore > 0.6,
      confidence: overallConfidence,
      discrepancies,
      recommendedAction: this.getRecommendedAction(overallConfidence, discrepancies.length, validationScore),
      validationScore
    };
    
    console.log(`✅ [CROSS VALIDATION] Validation complete:`, {
      isConsistent: result.isConsistent,
      confidence: result.confidence,
      discrepancyCount: discrepancies.length,
      validationScore,
      recommendedAction: result.recommendedAction
    });
    
    return result;
  }

  private validateMaterialConsistency(analyses: any[]): number {
    console.log("🔍 [MATERIAL VALIDATION] Checking material consistency");
    
    const materials = analyses.map(a => this.extractMaterial(a.description));
    const validMaterials = materials.filter(Boolean);
    const uniqueMaterials = new Set(validMaterials);
    
    console.log(`📊 [MATERIAL VALIDATION] Found materials:`, Array.from(uniqueMaterials));
    
    // If only one material detected across all images, high consistency
    if (uniqueMaterials.size <= 1) return 0.9;
    if (uniqueMaterials.size === 2) return 0.6; // Allow for composite materials
    return 0.3;
  }

  private validateConditionConsistency(analyses: any[]): number {
    console.log("🔍 [CONDITION VALIDATION] Checking condition consistency");
    
    const ratings = analyses.map(a => a.condition?.rating).filter(Boolean);
    const uniqueRatings = new Set(ratings);
    
    console.log(`📊 [CONDITION VALIDATION] Found ratings:`, Array.from(uniqueRatings));
    
    // Allow for one step variation (e.g., good to fair)
    if (uniqueRatings.size <= 1) return 0.9;
    if (uniqueRatings.size === 2) {
      // Check if ratings are adjacent in severity
      const ratingOrder = ['excellent', 'good', 'fair', 'poor'];
      const ratingIndices = Array.from(uniqueRatings).map(r => ratingOrder.indexOf(r)).filter(i => i !== -1);
      const maxDiff = Math.max(...ratingIndices) - Math.min(...ratingIndices);
      return maxDiff <= 1 ? 0.7 : 0.4;
    }
    return 0.2;
  }

  private validateCleanlinessConsistency(analyses: any[]): number {
    console.log("🔍 [CLEANLINESS VALIDATION] Checking cleanliness consistency");
    
    const cleanliness = analyses.map(a => a.cleanliness).filter(Boolean);
    const uniqueCleanliness = new Set(cleanliness);
    
    console.log(`📊 [CLEANLINESS VALIDATION] Found levels:`, Array.from(uniqueCleanliness));
    
    if (uniqueCleanliness.size <= 1) return 0.8;
    if (uniqueCleanliness.size === 2) return 0.5; // Allow for some variation in cleanliness assessment
    return 0.3;
  }

  private adjustForLightingDifferences(
    analyses: any[], 
    metadata: ImageMetadata[]
  ): number {
    console.log("🔍 [LIGHTING VALIDATION] Adjusting for lighting differences");
    
    // If images taken under different lighting conditions, adjust expectations
    const lightingConditions = new Set(metadata.map(m => m.lighting));
    const angleVariations = new Set(metadata.map(m => m.angle));
    
    console.log(`📊 [LIGHTING VALIDATION] Lighting conditions:`, Array.from(lightingConditions));
    console.log(`📊 [LIGHTING VALIDATION] Angle variations:`, Array.from(angleVariations));
    
    // More lighting/angle variations = lower consistency expectations
    let adjustmentFactor = 0.8;
    if (lightingConditions.size > 2) adjustmentFactor -= 0.2;
    if (angleVariations.size > 3) adjustmentFactor -= 0.1;
    
    return Math.max(adjustmentFactor, 0.3);
  }

  private validateTemporalConsistency(analyses: any[], metadata: ImageMetadata[]): number {
    console.log("🔍 [TEMPORAL VALIDATION] Checking temporal consistency");
    
    if (metadata.length < 2) return 0.8;
    
    // Check if images were taken within a reasonable timeframe
    const timestamps = metadata.map(m => m.timestamp).sort();
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    
    // Images taken within 5 minutes should be highly consistent
    if (timeSpan < 5 * 60 * 1000) return 0.9;
    // Images within 30 minutes are reasonably consistent
    if (timeSpan < 30 * 60 * 1000) return 0.7;
    // Longer time spans reduce consistency expectations
    return 0.5;
  }

  private calculateOverallConfidence(results: any): 'low' | 'medium' | 'high' {
    const weights = {
      materialConsistency: 0.3,
      conditionConsistency: 0.3,
      cleanlinessConsistency: 0.2,
      lightingAdjustment: 0.1,
      temporalConsistency: 0.1
    };
    
    const weightedAverage = Object.entries(results).reduce((sum, [key, value]) => {
      const weight = weights[key as keyof typeof weights] || 0;
      return sum + (typeof value === 'number' ? value * weight : 0);
    }, 0);
    
    console.log(`📊 [CONFIDENCE CALCULATION] Weighted average: ${weightedAverage.toFixed(3)}`);
    
    if (weightedAverage >= this.confidenceThresholds.high) return 'high';
    if (weightedAverage >= this.confidenceThresholds.medium) return 'medium';
    return 'low';
  }

  private calculateValidationScore(results: any): number {
    const values = Object.values(results).filter(v => typeof v === 'number') as number[];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private identifyDiscrepancies(results: any): string[] {
    const discrepancies: string[] = [];
    
    if (results.materialConsistency < 0.5) {
      discrepancies.push('Material identification inconsistent across images');
    }
    if (results.conditionConsistency < 0.4) {
      discrepancies.push('Condition ratings vary significantly between images');
    }
    if (results.cleanlinessConsistency < 0.5) {
      discrepancies.push('Cleanliness assessment inconsistent');
    }
    if (results.lightingAdjustment < 0.4) {
      discrepancies.push('Lighting conditions may be affecting analysis accuracy');
    }
    if (results.temporalConsistency < 0.5) {
      discrepancies.push('Images taken over extended time period may show changes');
    }
    
    return discrepancies;
  }

  private getRecommendedAction(
    confidence: string, 
    discrepancyCount: number, 
    validationScore: number
  ): 'accept' | 'review' | 'retake' {
    if (confidence === 'high' && discrepancyCount === 0 && validationScore > 0.8) {
      return 'accept';
    }
    
    if (confidence === 'low' || discrepancyCount > 2 || validationScore < 0.4) {
      return 'retake';
    }
    
    return 'review';
  }

  private extractMaterial(description: string): string | null {
    const materialKeywords = [
      'wood', 'wooden', 'timber', 'oak', 'pine', 'mahogany',
      'metal', 'steel', 'aluminum', 'iron', 'brass', 'copper',
      'plastic', 'vinyl', 'pvc', 'acrylic',
      'glass', 'glazed', 'crystal',
      'fabric', 'textile', 'cloth', 'canvas', 'leather',
      'ceramic', 'porcelain', 'tile', 'clay',
      'stone', 'marble', 'granite', 'slate', 'concrete',
      'laminate', 'veneer', 'composite'
    ];
    
    const lowerDescription = description.toLowerCase();
    return materialKeywords.find(material => 
      lowerDescription.includes(material)
    ) || null;
  }
}
