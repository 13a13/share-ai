
/**
 * Unified Response Parser - Multi-Component Array Analysis System
 */

export interface UnifiedAnalysisResult {
  description: string;
  condition: {
    summary: string;
    points: string[];
    rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  };
  cleanliness: string;
  analysisMetadata: {
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
  processingMetadata: {
    modelUsed: string;
    processingTime: number;
    parsingMethod: string;
    confidence: number;
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

export class UnifiedResponseParser {
  /**
   * Parse the new multi-component array response with robust fallback strategies
   */
  parseUnifiedResponse(textContent: string, processingTime: number): UnifiedAnalysisResult {
    console.log(`🔍 [UNIFIED PARSER] Starting multi-component response parsing`);
    
    // Strategy 1: Direct JSON parsing
    try {
      const directResult = this.parseDirectJSON(textContent);
      return this.normalizeMultiComponentResponse(directResult, processingTime, 'direct_json', 0.95);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Direct JSON failed: ${error}`);
    }

    // Strategy 2: Extract JSON from code blocks
    try {
      const codeBlockResult = this.extractJSONFromCodeBlock(textContent);
      return this.normalizeMultiComponentResponse(codeBlockResult, processingTime, 'code_block', 0.90);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Code block extraction failed: ${error}`);
    }

    // Strategy 3: Pattern-based extraction
    try {
      const patternResult = this.extractByPattern(textContent);
      return this.normalizeMultiComponentResponse(patternResult, processingTime, 'pattern_extraction', 0.80);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Pattern extraction failed: ${error}`);
    }

    // Strategy 4: Structured text parsing (legacy fallback)
    const fallbackResult = this.parseStructuredTextFallback(textContent);
    return this.normalizeMultiComponentResponse(fallbackResult, processingTime, 'structured_fallback', 0.60);
  }

  private parseDirectJSON(text: string): any {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return JSON.parse(trimmed);
    }
    throw new Error('Not direct JSON format');
  }

  private extractJSONFromCodeBlock(text: string): any {
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/i,
      /```\s*([\s\S]*?)\s*```/i,
      /\{[\s\S]*\}/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const jsonStr = match[1] || match[0];
        try {
          return JSON.parse(jsonStr.trim());
        } catch (e) {
          continue;
        }
      }
    }
    throw new Error('No JSON found in code blocks');
  }

  private extractByPattern(text: string): any {
    // Try to extract the new multi-component structure
    const sceneSummaryMatch = text.match(/"sceneSummary":\s*\{[\s\S]*?\}/);
    const componentsMatch = text.match(/"components":\s*\[[\s\S]*?\]/);
    
    if (sceneSummaryMatch && componentsMatch) {
      const reconstructed = `{${sceneSummaryMatch[0]},${componentsMatch[0]}}`;
      return JSON.parse(reconstructed);
    }
    
    // Fallback to legacy structure extraction
    const componentMatch = text.match(/"component":\s*\{[\s\S]*?\}/);
    const assessmentMatch = text.match(/"assessment":\s*\{[\s\S]*?\}/);
    
    if (componentMatch && assessmentMatch) {
      const reconstructed = `{${componentMatch[0]},${assessmentMatch[0]}}`;
      return JSON.parse(reconstructed);
    }
    
    throw new Error('Pattern extraction failed');
  }

  private parseStructuredTextFallback(text: string): any {
    // Create legacy single-component fallback structure
    return {
      sceneSummary: {
        componentQuery: 'Component',
        identifiedItemCount: 1,
        imageCount: 1,
        overallImpression: 'Assessment completed from text analysis'
      },
      components: [{
        componentId: 'item_1',
        inferredType: this.extractField(text, 'component') || 'Component',
        description: this.extractField(text, 'description') || 'Component analyzed from visual inspection',
        assessment: {
          condition: {
            rating: this.extractRating(text),
            summary: this.extractField(text, 'summary') || 'Assessment completed',
            details: {
              structuralIntegrity: 'Assessment required',
              functionalPerformance: 'Assessment required',
              aestheticCondition: 'Assessment required',
              safetyAssessment: 'Assessment required'
            },
            defects: this.extractDefects(text)
          },
          cleanliness: {
            rating: this.extractCleanliness(text),
            details: 'Assessment based on visual inspection'
          }
        },
        metadata: {
          estimatedAge: 'Unknown'
        }
      }]
    };
  }

  private normalizeMultiComponentResponse(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    console.log(`🔄 [UNIFIED PARSER] Normalizing multi-component response`);
    
    // Check if this is the new multi-component format
    if (rawData.sceneSummary && rawData.components && Array.isArray(rawData.components)) {
      return this.normalizeNewFormat(rawData, processingTime, method, confidence);
    }
    
    // Check if this is legacy single component format
    if (rawData.component || rawData.assessment) {
      return this.normalizeLegacyFormat(rawData, processingTime, method, confidence);
    }
    
    // If neither format is detected, create a minimal fallback
    return this.createFallbackResponse(rawData, processingTime, method, confidence);
  }

  private normalizeNewFormat(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    const sceneSummary = rawData.sceneSummary || {};
    const components = rawData.components || [];
    
    // Use the first component as the primary result for backward compatibility
    const primaryComponent = components[0] || {};
    const primaryAssessment = primaryComponent.assessment || {};
    const primaryCondition = primaryAssessment.condition || {};
    const primaryCleanliness = primaryAssessment.cleanliness || {};
    
    // Create the main description from the first component
    const description = primaryComponent.description || sceneSummary.overallImpression || 'Component analyzed';
    
    // Normalize condition points from the first component
    const points = this.normalizeConditionPoints(primaryCondition);
    
    // Normalize ratings
    const rating = this.normalizeRating(primaryCondition.rating);
    const cleanlinessRating = this.normalizeCleanliness(primaryCleanliness.rating);
    
    // Create normalized components array
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
          points: this.normalizeConditionPoints(condition)
        },
        cleanliness: this.normalizeCleanliness(cleanliness.rating),
        estimatedAge: comp.metadata?.estimatedAge || 'Unknown'
      };
    });

    return {
      description,
      condition: {
        summary: primaryCondition.summary || 'Assessment completed',
        points,
        rating
      },
      cleanliness: cleanlinessRating,
      analysisMetadata: {
        imageCount: sceneSummary.imageCount || 1,
        multiImageAnalysis: {
          isConsistent: true,
          consistencyScore: confidence,
          conflictingFindings: []
        },
        estimatedAge: primaryComponent.metadata?.estimatedAge || 'Unknown',
        itemCount: sceneSummary.identifiedItemCount || components.length,
        sceneSummary: sceneSummary.overallImpression || 'Multi-component analysis completed',
        multipleItems: components.length > 1
      },
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime,
        parsingMethod: method,
        confidence
      },
      components: normalizedComponents
    };
  }

  private normalizeLegacyFormat(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    // Handle legacy format for backward compatibility
    const component = rawData.component || {};
    const assessment = rawData.assessment || {};
    const condition = assessment.condition || {};
    const cleanliness = assessment.cleanliness || {};
    const metadata = rawData.analysisMetadata || {};

    // Create comprehensive description
    const description = this.buildLegacyDescription(component);

    // Normalize condition points
    const points = this.normalizeConditionPoints(condition);

    // Normalize ratings
    const rating = this.normalizeRating(condition.rating);
    const cleanlinessRating = this.normalizeCleanliness(cleanliness.rating);

    return {
      description,
      condition: {
        summary: condition.summary || 'Component assessed',
        points,
        rating
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
        confidence
      }
    };
  }

  private createFallbackResponse(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    return {
      description: 'Component analyzed from visual inspection',
      condition: {
        summary: 'Assessment completed',
        points: ['Visual assessment completed'],
        rating: 'fair' as const
      },
      cleanliness: 'domestic_clean',
      analysisMetadata: {
        imageCount: 1,
        multiImageAnalysis: {
          isConsistent: true,
          consistencyScore: 0.5,
          conflictingFindings: []
        },
        estimatedAge: 'Unknown',
        itemCount: 1,
        multipleItems: false
      },
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime,
        parsingMethod: method,
        confidence
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

  private normalizeConditionPoints(condition: any): string[] {
    const points: string[] = [];
    
    // Extract from defects array
    if (Array.isArray(condition.defects)) {
      points.push(...condition.defects.filter(Boolean));
    }
    
    // Extract from details object
    if (condition.details) {
      Object.values(condition.details).forEach(detail => {
        if (typeof detail === 'string' && detail !== 'Assessment required') {
          points.push(detail);
        }
      });
    }
    
    // Extract from points array (fallback)
    if (Array.isArray(condition.points)) {
      points.push(...condition.points.filter(Boolean));
    }
    
    return points.length > 0 ? points : ['Assessment completed'];
  }

  private normalizeRating(rating: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (!rating) return 'fair';
    
    const normalized = rating.toLowerCase();
    if (['excellent', 'good', 'fair', 'poor', 'critical'].includes(normalized)) {
      return normalized as any;
    }
    
    // Map variations
    if (normalized.includes('excellent') || normalized.includes('new')) return 'excellent';
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

  private extractField(text: string, field: string): string | null {
    const patterns = [
      new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i'),
      new RegExp(`${field}\\s*:\\s*"([^"]*)"`, 'i'),
      new RegExp(`${field}\\s*:\\s*([^\\n,}]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }

  private extractRating(text: string): string {
    const ratingMatch = text.match(/"rating":\s*"([^"]*)"/) || text.match(/rating:\s*([^\n,}]+)/i);
    return ratingMatch && ratingMatch[1] ? ratingMatch[1].trim() : 'fair';
  }

  private extractCleanliness(text: string): string {
    const cleanMatch = text.match(/"rating":\s*"([^"]*)".*cleanliness/i) || text.match(/cleanliness.*"rating":\s*"([^"]*)"/) || null;
    return cleanMatch && cleanMatch[1] ? cleanMatch[1].trim() : 'domestic_clean';
  }

  private extractDefects(text: string): string[] {
    const defectPatterns = [
      /"defects":\s*\[([\s\S]*?)\]/,
      /defects.*?:\s*\[([\s\S]*?)\]/i
    ];

    for (const pattern of defectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          return JSON.parse(`[${match[1]}]`).filter(Boolean);
        } catch (e) {
          continue;
        }
      }
    }
    return [];
  }
}
