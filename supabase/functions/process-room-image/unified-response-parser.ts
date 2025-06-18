
/**
 * Unified Response Parser - Single parsing system for the unified prompt
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
  };
  processingMetadata: {
    modelUsed: string;
    processingTime: number;
    parsingMethod: string;
    confidence: number;
  };
}

export class UnifiedResponseParser {
  /**
   * Parse the unified prompt response with robust fallback strategies
   */
  parseUnifiedResponse(textContent: string, processingTime: number): UnifiedAnalysisResult {
    console.log(`🔍 [UNIFIED PARSER] Starting unified response parsing`);
    
    // Strategy 1: Direct JSON parsing
    try {
      const directResult = this.parseDirectJSON(textContent);
      return this.normalizeResponse(directResult, processingTime, 'direct_json', 0.95);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Direct JSON failed: ${error}`);
    }

    // Strategy 2: Extract JSON from code blocks
    try {
      const codeBlockResult = this.extractJSONFromCodeBlock(textContent);
      return this.normalizeResponse(codeBlockResult, processingTime, 'code_block', 0.90);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Code block extraction failed: ${error}`);
    }

    // Strategy 3: Pattern-based extraction
    try {
      const patternResult = this.extractByPattern(textContent);
      return this.normalizeResponse(patternResult, processingTime, 'pattern_extraction', 0.80);
    } catch (error) {
      console.log(`⚠️ [UNIFIED PARSER] Pattern extraction failed: ${error}`);
    }

    // Strategy 4: Structured text parsing
    const fallbackResult = this.parseStructuredText(textContent);
    return this.normalizeResponse(fallbackResult, processingTime, 'structured_fallback', 0.60);
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
    // Extract structured data using patterns
    const componentMatch = text.match(/"component":\s*\{[\s\S]*?\}/);
    const assessmentMatch = text.match(/"assessment":\s*\{[\s\S]*?\}/);
    
    if (componentMatch && assessmentMatch) {
      const reconstructed = `{${componentMatch[0]},${assessmentMatch[0]}}`;
      return JSON.parse(reconstructed);
    }
    throw new Error('Pattern extraction failed');
  }

  private parseStructuredText(text: string): any {
    // Fallback structured text parsing
    return {
      component: {
        name: this.extractField(text, 'component') || 'Component',
        description: {
          material: this.extractField(text, 'material') || 'Material not specified',
          form: this.extractField(text, 'form') || 'Form not specified',
          color: this.extractField(text, 'color') || 'Color not specified'
        }
      },
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
      analysisMetadata: {
        imageCount: 1,
        multiImageAnalysis: {
          isConsistent: true,
          consistencyScore: 0.8,
          conflictingFindings: []
        },
        estimatedAge: 'Unknown'
      }
    };
  }

  private normalizeResponse(rawData: any, processingTime: number, method: string, confidence: number): UnifiedAnalysisResult {
    // Normalize the response to match the expected interface
    const component = rawData.component || {};
    const assessment = rawData.assessment || {};
    const condition = assessment.condition || {};
    const cleanliness = assessment.cleanliness || {};
    const metadata = rawData.analysisMetadata || {};

    // Create comprehensive description
    const description = this.buildDescription(component);

    // Normalize condition points
    const points = this.normalizeConditionPoints(condition);

    // Normalize rating
    const rating = this.normalizeRating(condition.rating);

    // Normalize cleanliness
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
        estimatedAge: metadata.estimatedAge || 'Unknown'
      },
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime,
        parsingMethod: method,
        confidence
      }
    };
  }

  private buildDescription(component: any): string {
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
