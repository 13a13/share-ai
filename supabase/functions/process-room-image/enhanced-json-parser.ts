
/**
 * Enhanced JSON Parser with Robust Fallback Strategies
 * Phase 3 Implementation: Robust JSON output format
 */

export interface ParseResult {
  success: boolean;
  data: any;
  method: string;
  confidence: number;
  validationErrors?: string[];
}

export class EnhancedJSONParser {
  
  /**
   * Parse response with multiple fallback strategies
   */
  parseWithFallbacks(textContent: string): ParseResult {
    console.log(`🔍 [ENHANCED PARSER] Starting robust JSON parsing`);
    
    // Strategy 1: Direct JSON parsing
    try {
      const directResult = this.parseDirectJSON(textContent);
      if (directResult.success) {
        return { ...directResult, method: 'direct_json', confidence: 0.95 };
      }
    } catch (error) {
      console.log(`⚠️ [ENHANCED PARSER] Direct JSON failed: ${error}`);
    }

    // Strategy 2: Extract JSON from markdown blocks
    try {
      const markdownResult = this.extractJSONFromMarkdown(textContent);
      if (markdownResult.success) {
        return { ...markdownResult, method: 'markdown_extraction', confidence: 0.90 };
      }
    } catch (error) {
      console.log(`⚠️ [ENHANCED PARSER] Markdown extraction failed: ${error}`);
    }

    // Strategy 3: Pattern-based JSON extraction
    try {
      const patternResult = this.extractJSONByPattern(textContent);
      if (patternResult.success) {
        return { ...patternResult, method: 'pattern_extraction', confidence: 0.85 };
      }
    } catch (error) {
      console.log(`⚠️ [ENHANCED PARSER] Pattern extraction failed: ${error}`);
    }

    // Strategy 4: Partial JSON reconstruction
    try {
      const partialResult = this.reconstructPartialJSON(textContent);
      if (partialResult.success) {
        return { ...partialResult, method: 'partial_reconstruction', confidence: 0.75 };
      }
    } catch (error) {
      console.log(`⚠️ [ENHANCED PARSER] Partial reconstruction failed: ${error}`);
    }

    // Strategy 5: Text-based fallback with structured parsing
    return this.createFallbackStructure(textContent);
  }

  private parseDirectJSON(text: string): ParseResult {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      return {
        success: true,
        data: this.validateAndNormalizeStructure(parsed),
        method: 'direct',
        confidence: 1.0
      };
    }
    throw new Error('Not direct JSON format');
  }

  private extractJSONFromMarkdown(text: string): ParseResult {
    const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const match = text.match(jsonBlockRegex);
    
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      return {
        success: true,
        data: this.validateAndNormalizeStructure(parsed),
        method: 'markdown',
        confidence: 0.9
      };
    }
    throw new Error('No JSON block found in markdown');
  }

  private extractJSONByPattern(text: string): ParseResult {
    // Look for JSON-like structures anywhere in the text
    const patterns = [
      /\{[\s\S]*?"description"[\s\S]*?\}/g,
      /\{[\s\S]*?"condition"[\s\S]*?\}/g,
      /\{[\s\S]*?"cleanliness"[\s\S]*?\}/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            return {
              success: true,
              data: this.validateAndNormalizeStructure(parsed),
              method: 'pattern',
              confidence: 0.8
            };
          } catch (e) {
            continue;
          }
        }
      }
    }
    throw new Error('No valid JSON patterns found');
  }

  private reconstructPartialJSON(text: string): ParseResult {
    console.log(`🔧 [ENHANCED PARSER] Attempting partial JSON reconstruction`);
    
    // Extract key-value pairs from text
    const description = this.extractField(text, 'description');
    const condition = this.extractCondition(text);
    const cleanliness = this.extractField(text, 'cleanliness');
    const defects = this.extractDefects(text);

    const reconstructed = {
      description: description || 'Component observed',
      condition: condition || {
        summary: 'Condition assessment based on available information',
        rating: 'fair'
      },
      cleanliness: cleanliness || 'domestic_clean',
      ...(defects && defects.length > 0 && { defects })
    };

    return {
      success: true,
      data: reconstructed,
      method: 'reconstruction',
      confidence: 0.7
    };
  }

  private createFallbackStructure(text: string): ParseResult {
    console.log(`🛡️ [ENHANCED PARSER] Creating fallback structure`);
    
    return {
      success: true,
      data: {
        description: 'Component analysis completed',
        condition: {
          summary: 'Assessment based on available visual information',
          points: ['Analysis completed with available data'],
          rating: 'fair'
        },
        cleanliness: 'domestic_clean',
        analysisMetadata: {
          parsingMethod: 'fallback',
          originalResponse: text.substring(0, 500),
          requiresReview: true
        }
      },
      method: 'fallback',
      confidence: 0.5
    };
  }

  private validateAndNormalizeStructure(data: any): any {
    // Ensure required fields exist
    if (!data.description) {
      data.description = 'Component observed';
    }

    if (!data.condition) {
      data.condition = {
        summary: 'Condition assessment completed',
        rating: 'fair'
      };
    }

    if (!data.condition.rating) {
      data.condition.rating = 'fair';
    }

    // Normalize rating values
    const rating = data.condition.rating.toLowerCase();
    if (['excellent', 'good', 'fair', 'poor'].includes(rating)) {
      data.condition.rating = rating;
    } else {
      data.condition.rating = 'fair';
    }

    // Normalize cleanliness
    if (data.cleanliness) {
      const validCleanliness = [
        'professional_clean',
        'professional_clean_with_omissions', 
        'domestic_clean_high_level',
        'domestic_clean',
        'not_clean'
      ];
      
      const cleanliness = data.cleanliness.toLowerCase();
      if (!validCleanliness.includes(cleanliness)) {
        data.cleanliness = 'domestic_clean';
      }
    }

    return data;
  }

  private extractField(text: string, fieldName: string): string | null {
    const patterns = [
      new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i'),
      new RegExp(`${fieldName}\\s*:\\s*"([^"]*)"`, 'i'),
      new RegExp(`${fieldName}\\s*:\\s*([^\\n,}]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractCondition(text: string): any {
    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*)"/i);
    const ratingMatch = text.match(/"rating"\s*:\s*"([^"]*)"/i);
    
    return {
      summary: summaryMatch ? summaryMatch[1] : 'Condition assessed based on visual inspection',
      rating: ratingMatch ? ratingMatch[1].toLowerCase() : 'fair'
    };
  }

  private extractDefects(text: string): any[] | null {
    try {
      const defectsMatch = text.match(/"defects"\s*:\s*\[([\s\S]*?)\]/i);
      if (defectsMatch) {
        return JSON.parse(`[${defectsMatch[1]}]`);
      }
    } catch (e) {
      console.log(`⚠️ [ENHANCED PARSER] Could not extract defects array`);
    }
    return null;
  }
}
