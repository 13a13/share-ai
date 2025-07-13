/**
 * Unified Response Parser - Enhanced Multi-Component Array Analysis System
 */

import { EnhancedResponseFormatter } from './enhanced-response-formatter.ts';

export interface UnifiedAnalysisResult {
  description: string;
  condition: {
    summary: string;
    points: any[];
    rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    details?: {
      structuralIntegrity: string;
      functionalPerformance: string;
      aestheticCondition: string;
      safetyAssessment: string;
    };
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
    // Enhanced fields for multi-component support
    itemCount?: number;
    sceneSummary?: string;
    multipleItems?: boolean;
  };
  processingMetadata: {
    modelUsed: string;
    processingTime: number;
    parsingMethod: string;
    confidence: number;
    unifiedSystem?: boolean;
    enhancedFormatting?: boolean;
  };
  // Enhanced field for storing multiple component data
  components?: Array<{
    componentId: string;
    inferredType: string;
    description: string;
    condition: {
      rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      summary: string;
      points: any[];
      details?: {
        structuralIntegrity: string;
        functionalPerformance: string;
        aestheticCondition: string;
        safetyAssessment: string;
      };
    };
    cleanliness: string;
    estimatedAge: string;
  }>;
}

export class UnifiedResponseParser {
  private formatter: EnhancedResponseFormatter;

  constructor() {
    this.formatter = new EnhancedResponseFormatter();
  }

  /**
   * Parse the enhanced multi-component array response with robust fallback strategies
   */
  parseUnifiedResponse(textContent: string, processingTime: number): UnifiedAnalysisResult {
    console.log(`🔍 [ENHANCED UNIFIED PARSER] Starting multi-component response parsing`);
    
    // Strategy 1: Direct JSON parsing with enhanced validation
    try {
      const directResult = this.parseDirectJSON(textContent);
      return this.formatter.formatEnhancedResponse(directResult, processingTime, 'direct_json', 0.95);
    } catch (error) {
      console.log(`⚠️ [ENHANCED UNIFIED PARSER] Direct JSON failed: ${error}`);
    }

    // Strategy 2: Extract JSON from code blocks with better pattern matching
    try {
      const codeBlockResult = this.extractJSONFromCodeBlock(textContent);
      return this.formatter.formatEnhancedResponse(codeBlockResult, processingTime, 'code_block', 0.90);
    } catch (error) {
      console.log(`⚠️ [ENHANCED UNIFIED PARSER] Code block extraction failed: ${error}`);
    }

    // Strategy 3: Enhanced pattern-based extraction
    try {
      const patternResult = this.extractByEnhancedPattern(textContent);
      return this.formatter.formatEnhancedResponse(patternResult, processingTime, 'enhanced_pattern', 0.85);
    } catch (error) {
      console.log(`⚠️ [ENHANCED UNIFIED PARSER] Enhanced pattern extraction failed: ${error}`);
    }

    // Strategy 4: Structured text parsing (legacy fallback)
    const fallbackResult = this.parseStructuredTextFallback(textContent);
    return this.formatter.formatEnhancedResponse(fallbackResult, processingTime, 'structured_fallback', 0.60);
  }

  private parseDirectJSON(text: string): any {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      // Validate the enhanced schema structure
      if (parsed.sceneSummary && parsed.components && Array.isArray(parsed.components)) {
        console.log(`✅ [ENHANCED PARSER] Valid enhanced schema detected with ${parsed.components.length} components`);
        return parsed;
      }
    }
    throw new Error('Not enhanced JSON format');
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
          const parsed = JSON.parse(jsonStr.trim());
          // Validate enhanced schema
          if (parsed.sceneSummary && parsed.components) {
            console.log(`✅ [ENHANCED PARSER] Enhanced schema found in code block with ${parsed.components.length} components`);
            return parsed;
          }
          return parsed;
        } catch (e) {
          continue;
        }
      }
    }
    throw new Error('No valid JSON found in code blocks');
  }

  private extractByEnhancedPattern(text: string): any {
    // Enhanced pattern extraction for the new schema
    const sceneSummaryMatch = text.match(/"sceneSummary":\s*\{[^}]*"componentQuery":[^}]*"identifiedItemCount":[^}]*"imageCount":[^}]*"overallImpression":[^}]*\}/);
    const componentsMatch = text.match(/"components":\s*\[[\s\S]*?\]/);
    
    if (sceneSummaryMatch && componentsMatch) {
      try {
        const reconstructed = `{${sceneSummaryMatch[0]},${componentsMatch[0]}}`;
        const parsed = JSON.parse(reconstructed);
        console.log(`✅ [ENHANCED PARSER] Reconstructed enhanced schema with ${parsed.components?.length || 0} components`);
        return parsed;
      } catch (e) {
        console.log(`⚠️ [ENHANCED PARSER] Failed to reconstruct enhanced schema: ${e}`);
      }
    }
    
    // Fallback to legacy structure extraction
    const componentMatch = text.match(/"component":\s*\{[\s\S]*?\}/);
    const assessmentMatch = text.match(/"assessment":\s*\{[\s\S]*?\}/);
    
    if (componentMatch && assessmentMatch) {
      const reconstructed = `{${componentMatch[0]},${assessmentMatch[0]}}`;
      return JSON.parse(reconstructed);
    }
    
    throw new Error('Enhanced pattern extraction failed');
  }

  private parseStructuredTextFallback(text: string): any {
    // Create enhanced single-component fallback structure
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
              structuralIntegrity: 'Assessment completed',
              functionalPerformance: 'Assessment completed',
              aestheticCondition: 'Assessment completed',
              safetyAssessment: 'Assessment completed'
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

  private normalizeEnhancedResponse(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    console.log(`🔄 [ENHANCED UNIFIED PARSER] Normalizing enhanced multi-component response`);
    
    // Check if this is the enhanced multi-component format
    if (rawData.sceneSummary && rawData.components && Array.isArray(rawData.components)) {
      return this.normalizeEnhancedFormat(rawData, processingTime, method, confidence);
    }
    
    // Check if this is legacy single component format
    if (rawData.component || rawData.assessment) {
      return this.normalizeLegacyFormat(rawData, processingTime, method, confidence);
    }
    
    // If neither format is detected, create enhanced fallback
    return this.createEnhancedFallbackResponse(rawData, processingTime, method, confidence);
  }

  private normalizeEnhancedFormat(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    const sceneSummary = rawData.sceneSummary || {};
    const components = rawData.components || [];
    
    console.log(`📊 [ENHANCED PARSER] Processing ${components.length} components from enhanced format`);
    
    // Use the first component as the primary result for backward compatibility
    const primaryComponent = components[0] || {};
    const primaryAssessment = primaryComponent.assessment || {};
    const primaryCondition = primaryAssessment.condition || {};
    const primaryCleanliness = primaryAssessment.cleanliness || {};
    
    // Enhanced description handling - combine individual descriptions if multiple components
    const description = components.length > 1 
      ? `${components.length} items identified: ${components.map(c => c.description || c.inferredType).join('; ')}`
      : (primaryComponent.description || sceneSummary.overallImpression || 'Component analyzed');
    
    // Enhanced condition points from all components
    const allPoints = this.aggregateConditionPoints(components);
    
    // Normalize ratings with enhanced mapping
    const rating = this.normalizeEnhancedRating(primaryCondition.rating);
    const cleanlinessRating = this.normalizeEnhancedCleanliness(primaryCleanliness.rating);
    
    // Create enhanced normalized components array
    const normalizedComponents = components.map((comp: any, index: number) => {
      const assessment = comp.assessment || {};
      const condition = assessment.condition || {};
      const cleanliness = assessment.cleanliness || {};
      
      return {
        componentId: comp.componentId || `item_${index + 1}`,
        inferredType: comp.inferredType || 'Component',
        description: comp.description || 'Component analyzed',
        condition: {
          rating: this.normalizeEnhancedRating(condition.rating),
          summary: condition.summary || 'Assessment completed',
          points: this.normalizeConditionPoints(condition)
        },
        cleanliness: this.normalizeEnhancedCleanliness(cleanliness.rating),
        estimatedAge: comp.metadata?.estimatedAge || 'Unknown'
      };
    });

    return {
      description,
      condition: {
        summary: components.length > 1 
          ? `Assessment of ${components.length} ${sceneSummary.componentQuery || 'components'} completed`
          : (primaryCondition.summary || 'Assessment completed'),
        points: allPoints,
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

  private aggregateConditionPoints(components: any[]): string[] {
    const allPoints: string[] = [];
    
    components.forEach((comp, index) => {
      const condition = comp.assessment?.condition || {};
      const componentPoints = this.normalizeConditionPoints(condition);
      
      // Prefix with component identifier if multiple components
      if (components.length > 1 && componentPoints.length > 0) {
        const prefix = comp.inferredType || `Item ${index + 1}`;
        const prefixedPoints = componentPoints.map(point => `${prefix}: ${point}`);
        allPoints.push(...prefixedPoints);
      } else {
        allPoints.push(...componentPoints);
      }
    });
    
    return allPoints.length > 0 ? allPoints : ['Assessment completed'];
  }

  private normalizeEnhancedRating(rating: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (!rating) return 'fair';
    
    const normalized = rating.toLowerCase();
    
    // Direct mapping for enhanced ratings
    if (['excellent', 'good', 'fair', 'poor', 'critical'].includes(normalized)) {
      return normalized as any;
    }
    
    // Enhanced mapping variations
    if (normalized.includes('excellent') || normalized.includes('pristine') || normalized.includes('perfect')) return 'excellent';
    if (normalized.includes('good') || normalized.includes('used order') || normalized.includes('light wear')) return 'good';
    if (normalized.includes('poor') || normalized.includes('damaged') || normalized.includes('significant')) return 'poor';
    if (normalized.includes('critical') || normalized.includes('severe') || normalized.includes('safety')) return 'critical';
    
    return 'fair';
  }

  private normalizeEnhancedCleanliness(cleanliness: any): string {
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
    const rating = this.normalizeEnhancedRating(condition.rating);
    const cleanlinessRating = this.normalizeEnhancedCleanliness(cleanliness.rating);

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

  private createEnhancedFallbackResponse(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
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
