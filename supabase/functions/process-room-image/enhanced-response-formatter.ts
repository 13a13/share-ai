
/**
 * Enhanced Response Formatter - Preserves Rich Assessment Structure
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

export class EnhancedResponseFormatter {
  /**
   * Format enhanced response preserving all assessment details
   */
  formatEnhancedResponse(rawData: any, processingTime: number, method: string, confidence: number) {
    console.log(`📋 [ENHANCED FORMATTER] Formatting response with rich assessment structure`);
    
    if (rawData.sceneSummary && rawData.components && Array.isArray(rawData.components)) {
      return this.formatMultiComponentResponse(rawData, processingTime, method, confidence);
    }
    
    // Handle legacy single component format
    return this.formatLegacyResponse(rawData, processingTime, method, confidence);
  }

  private formatMultiComponentResponse(rawData: any, processingTime: number, method: string, confidence: number) {
    const sceneSummary = rawData.sceneSummary || {};
    const components = rawData.components || [];
    
    console.log(`📊 [ENHANCED FORMATTER] Processing ${components.length} components with rich details`);
    
    // Use the first component as the primary result for backward compatibility
    const primaryComponent = components[0] || {};
    const primaryAssessment = primaryComponent.assessment || {};
    const primaryCondition = primaryAssessment.condition || {};
    const primaryCleanliness = primaryAssessment.cleanliness || {};
    
    // Enhanced description handling
    const description = components.length > 1 
      ? `${components.length} items identified: ${components.map(c => c.description || c.inferredType).join('; ')}`
      : (primaryComponent.description || sceneSummary.overallImpression || 'Component analyzed');
    
    // Create enhanced condition points with rich structure
    const enhancedPoints = this.createEnhancedConditionPoints(components);
    
    // Enhanced condition details from primary component
    const conditionDetails = this.extractConditionDetails(primaryCondition);
    
    // Normalize ratings
    const rating = this.normalizeRating(primaryCondition.rating);
    const cleanlinessRating = this.normalizeCleanliness(primaryCleanliness.rating);
    
    // Create enhanced normalized components array with full details
    const normalizedComponents = components.map((comp: any, index: number) => {
      const assessment = comp.assessment || {};
      const condition = assessment.condition || {};
      const cleanliness = assessment.cleanliness || {};
      
      return {
        componentId: comp.componentId || `item_${index + 1}`,
        inferredType: comp.inferredType || 'Component',
        description: comp.description || 'Component analyzed',
        condition: {
          rating: this.normalizeRating(condition.rating),
          summary: condition.summary || 'Assessment completed',
          points: this.createComponentConditionPoints(condition),
          details: this.extractConditionDetails(condition)
        },
        cleanliness: this.normalizeCleanliness(cleanliness.rating),
        estimatedAge: comp.metadata?.estimatedAge || comp.spatialContext?.estimatedAge || 'Unknown'
      };
    });

    return {
      description,
      condition: {
        summary: components.length > 1 
          ? `Assessment of ${components.length} ${sceneSummary.componentQuery || 'components'} completed`
          : (primaryCondition.summary || 'Assessment completed'),
        points: enhancedPoints,
        rating,
        details: conditionDetails
      },
      cleanliness: cleanlinessRating,
      analysisMetadata: {
        imageCount: sceneSummary.imageCount || 1,
        multiImageAnalysis: {
          isConsistent: true,
          consistencyScore: confidence,
          conflictingFindings: []
        },
        estimatedAge: primaryComponent.metadata?.estimatedAge || primaryComponent.spatialContext?.estimatedAge || 'Unknown',
        itemCount: sceneSummary.identifiedItemCount || components.length,
        sceneSummary: sceneSummary.overallImpression || 'Enhanced multi-component analysis completed',
        multipleItems: components.length > 1
      },
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime,
        parsingMethod: method,
        confidence,
        unifiedSystem: true,
        enhancedFormatting: true
      },
      components: normalizedComponents
    };
  }

  private createEnhancedConditionPoints(components: any[]): EnhancedConditionPoint[] {
    const enhancedPoints: EnhancedConditionPoint[] = [];
    
    components.forEach((comp, index) => {
      const condition = comp.assessment?.condition || {};
      const componentPoints = this.createComponentConditionPoints(condition);
      
      // Add component context if multiple components
      if (components.length > 1 && componentPoints.length > 0) {
        const prefix = comp.inferredType || `Item ${index + 1}`;
        componentPoints.forEach(point => {
          if (typeof point === 'string') {
            enhancedPoints.push({
              label: `${prefix}: ${point}`,
              category: this.categorizePoint(point),
              severity: this.assessSeverity(point)
            });
          } else {
            enhancedPoints.push({
              ...point,
              label: `${prefix}: ${point.label}`
            });
          }
        });
      } else {
        componentPoints.forEach(point => {
          if (typeof point === 'string') {
            enhancedPoints.push({
              label: point,
              category: this.categorizePoint(point),
              severity: this.assessSeverity(point)
            });
          } else {
            enhancedPoints.push(point);
          }
        });
      }
    });
    
    return enhancedPoints.length > 0 ? enhancedPoints : [{
      label: 'Assessment completed',
      category: 'functional',
      severity: 'minor'
    }];
  }

  private createComponentConditionPoints(condition: any): (string | EnhancedConditionPoint)[] {
    const points: (string | EnhancedConditionPoint)[] = [];
    
    // NEW: Extract from locationSpecificFindings array (new prompt format)
    if (Array.isArray(condition.locationSpecificFindings)) {
      points.push(...condition.locationSpecificFindings.filter(Boolean));
    }
    
    // Extract from defects array (legacy format)
    if (Array.isArray(condition.defects)) {
      points.push(...condition.defects.filter(Boolean));
    }
    
    // Extract from details object
    if (condition.details) {
      Object.entries(condition.details).forEach(([category, detail]) => {
        if (typeof detail === 'string' && detail !== 'Assessment required') {
          points.push({
            label: detail,
            category: this.mapCategoryName(category),
            severity: this.assessSeverity(detail)
          });
        }
      });
    }
    
    // Extract from points array (fallback)
    if (Array.isArray(condition.points)) {
      points.push(...condition.points.filter(Boolean));
    }
    
    return points.length > 0 ? points : ['Assessment completed'];
  }

  private extractConditionDetails(condition: any): EnhancedConditionDetails {
    const details = condition.details || {};
    
    return {
      structuralIntegrity: details.structuralIntegrity || 'Assessment completed',
      functionalPerformance: details.functionalPerformance || 'Assessment completed',
      aestheticCondition: details.aestheticCondition || 'Assessment completed',
      safetyAssessment: details.safetyAssessment || 'Assessment completed'
    };
  }

  private categorizePoint(point: string): 'structural' | 'functional' | 'aesthetic' | 'safety' {
    const pointLower = point.toLowerCase();
    
    if (pointLower.includes('crack') || pointLower.includes('loose') || pointLower.includes('structural')) {
      return 'structural';
    }
    if (pointLower.includes('function') || pointLower.includes('operation') || pointLower.includes('performance')) {
      return 'functional';
    }
    if (pointLower.includes('safety') || pointLower.includes('hazard') || pointLower.includes('risk')) {
      return 'safety';
    }
    return 'aesthetic';
  }

  private assessSeverity(point: string): 'minor' | 'moderate' | 'major' | 'critical' {
    const pointLower = point.toLowerCase();
    
    if (pointLower.includes('critical') || pointLower.includes('severe') || pointLower.includes('immediate')) {
      return 'critical';
    }
    if (pointLower.includes('major') || pointLower.includes('significant') || pointLower.includes('extensive')) {
      return 'major';
    }
    if (pointLower.includes('moderate') || pointLower.includes('noticeable') || pointLower.includes('considerable')) {
      return 'moderate';
    }
    return 'minor';
  }

  private mapCategoryName(category: string): 'structural' | 'functional' | 'aesthetic' | 'safety' {
    switch (category) {
      case 'structuralIntegrity': return 'structural';
      case 'functionalPerformance': return 'functional';
      case 'aestheticCondition': return 'aesthetic';
      case 'safetyAssessment': return 'safety';
      default: return 'functional';
    }
  }

  private normalizeRating(rating: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (!rating) return 'fair';
    
    const normalized = rating.toLowerCase();
    
    if (['excellent', 'good', 'fair', 'poor', 'critical'].includes(normalized)) {
      return normalized as any;
    }
    
    if (normalized.includes('excellent') || normalized.includes('pristine')) return 'excellent';
    if (normalized.includes('good') || normalized.includes('used order')) return 'good';
    if (normalized.includes('poor') || normalized.includes('damaged')) return 'poor';
    if (normalized.includes('critical') || normalized.includes('severe')) return 'critical';
    
    return 'fair';
  }

  private normalizeCleanliness(cleanliness: any): string {
    if (!cleanliness) return 'domestic_clean';
    
    const normalized = cleanliness.toLowerCase().replace(/\s+/g, '_');
    const validOptions = [
      'professional_clean',
      'professional_clean_with_omissions',
      'domestic_clean_high_level',
      'domestic_clean',
      'not_clean'
    ];
    
    return validOptions.includes(normalized) ? normalized : 'domestic_clean';
  }

  private formatLegacyResponse(rawData: any, processingTime: number, method: string, confidence: number) {
    // Handle legacy format for backward compatibility
    const component = rawData.component || {};
    const assessment = rawData.assessment || {};
    const condition = assessment.condition || {};
    const cleanliness = assessment.cleanliness || {};
    const metadata = rawData.analysisMetadata || {};

    const description = this.buildLegacyDescription(component);
    const points = this.createComponentConditionPoints(condition);
    const rating = this.normalizeRating(condition.rating);
    const cleanlinessRating = this.normalizeCleanliness(cleanliness.rating);

    return {
      description,
      condition: {
        summary: condition.summary || 'Component assessed',
        points,
        rating,
        details: this.extractConditionDetails(condition)
      },
      cleanliness: cleanlinessRating,
      analysisMetadata: {
        imageCount: metadata.imageCount || 1,
        multiImageAnalysis: {
          isConsistent: metadata.multiImageAnalysis?.isConsistent ?? true,
          consistencyScore: metadata.multiImageAnalysis?.consistencyScore ?? 1.0,
          conflictingFindings: metadata.multiImageAnalysis?.conflictingFindings || []
        },
        estimatedAge: metadata.estimatedAge || 'Unknown',
        itemCount: 1,
        multipleItems: false
      },
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime,
        parsingMethod: method,
        confidence,
        enhancedFormatting: true
      }
    };
  }

  private buildLegacyDescription(component: any): string {
    if (component.description) {
      const desc = component.description;
      const parts = [
        desc.material || 'Material not specified',
        desc.form || 'Form not specified',
        desc.color || 'Color not specified'
      ];
      return parts.join(', ');
    }
    return component.name || 'Component observed';
  }
}
