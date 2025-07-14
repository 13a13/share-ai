/**
 * Simplified AI Processor - Exclusively uses Gemini 2.0 Flash
 * Updated to use the standardized Gemini API
 */

import { SimplifiedModelManager } from "./simplified-model-manager.ts";
import { PromptManager } from "./prompt-manager.ts";
import { CrossImageValidator } from "./cross-validation.ts";
import { validateDustDetection } from "./dust-detection.ts";
import { createGeminiRequest } from "./gemini-api.ts";
import { parseInventoryResponse } from "./inventory-parser.ts";
import type { AIProcessingOptions } from './ai-processing-options.ts';

export interface SimplifiedAIResult {
  parsedData: any;
  validationResult?: any;
  modelUsed: string;
  processingTime: number;
}

export class SimplifiedAIProcessor {
  private modelManager: SimplifiedModelManager;
  private promptManager: PromptManager;
  private crossValidator: CrossImageValidator;

  constructor() {
    this.modelManager = new SimplifiedModelManager();
    this.promptManager = new PromptManager();
    this.crossValidator = new CrossImageValidator();
  }

  async processWithGemini25Pro(
    processedImages: string[],
    options: AIProcessingOptions,
    apiKey: string
  ): Promise<SimplifiedAIResult> {
    const startTime = Date.now();
    console.log(`🚀 [SIMPLIFIED AI] Starting Gemini 2.0 Flash processing for ${processedImages.length} images`);
    
    const { componentName, roomType, inventoryMode, useAdvancedAnalysis, imageCount } = options;
    
    // Always use advanced analysis for Gemini 2.0 Flash (it's powerful enough)
    const shouldUseAdvancedAnalysis = imageCount > 1;
    
    console.log(`📊 [SIMPLIFIED AI] Processing with Gemini 2.0 Flash:`, {
      shouldUseAdvancedAnalysis,
      inventoryMode,
      imageCount,
      componentName
    });
    
    // Generate optimized prompt for Gemini 2.0 Flash
    const promptType = inventoryMode ? 'inventory' : (shouldUseAdvancedAnalysis ? 'advanced' : 'dust');
    const prompt = this.promptManager.getPrompt(
      'gemini-2.0-flash' as any,
      promptType,
      componentName || 'component',
      roomType,
      imageCount
    );
    
    let parsedData: any;
    
    try {
      // Process with Gemini 2.0 Flash exclusively using standardized request
      const request = createGeminiRequest(prompt, processedImages);
      const result = await this.modelManager.callGemini2Flash(apiKey, request, {
        maxRetries: 3,
        timeout: 60000
      });
      
      // Parse result
      parsedData = this.parseResult(result, shouldUseAdvancedAnalysis, inventoryMode, componentName);
      
    } catch (error) {
      console.error(`❌ [SIMPLIFIED AI] Gemini 2.0 Flash processing failed:`, error);
      throw error;
    }
    
    // Enhanced validation for multi-image analysis
    let validationResult;
    if (shouldUseAdvancedAnalysis && imageCount > 2) {
      console.log(`🔍 [SIMPLIFIED AI] Running cross-image validation`);
      try {
        const imageMetadata = processedImages.map((_, index) => ({
          lighting: 'standard',
          angle: `perspective_${index + 1}`,
          timestamp: Date.now() - (index * 1000)
        }));
        
        validationResult = await this.crossValidator.validateAcrossImages(
          [parsedData],
          imageMetadata
        );
        
        console.log(`✅ [SIMPLIFIED AI] Validation completed:`, {
          isConsistent: validationResult.isConsistent,
          confidence: validationResult.confidence
        });
      } catch (validationError) {
        console.warn(`⚠️ [SIMPLIFIED AI] Validation failed:`, validationError);
      }
    }
    
    // Apply dust detection validation
    if (promptType === 'dust' || inventoryMode) {
      console.log(`🧹 [SIMPLIFIED AI] Applying dust detection validation`);
      parsedData = validateDustDetection(parsedData);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ [SIMPLIFIED AI] Gemini 2.0 Flash processing complete:`, {
      processingTime: `${processingTime}ms`,
      validationApplied: !!validationResult
    });
    
    return {
      parsedData,
      validationResult,
      modelUsed: 'gemini-2.0-flash',
      processingTime
    };
  }

  private parseResult(textContent: string, advanced: boolean, inventoryMode: boolean, componentName?: string): any {
    console.log(`🔍 [SIMPLIFIED AI] Parsing result for ${componentName || 'unknown component'}`);
    console.log(`📝 [SIMPLIFIED AI] Raw response:`, textContent.substring(0, 500) + '...');
    
    try {
      // Try JSON parsing first
      const jsonResult = JSON.parse(textContent);
      console.log(`✅ [SIMPLIFIED AI] JSON parsed successfully:`, jsonResult);
      return jsonResult;
    } catch {
      console.log(`📝 [SIMPLIFIED AI] JSON parsing failed, using inventory parser and text extraction`);
      
      // Use inventory parser for structured responses
      if (inventoryMode || componentName) {
        try {
          const inventoryResult = parseInventoryResponse(textContent);
          console.log(`✅ [SIMPLIFIED AI] Inventory parser result:`, inventoryResult);
          if (inventoryResult && (inventoryResult.description || inventoryResult.condition)) {
            return inventoryResult;
          }
        } catch (parseError) {
          console.warn(`⚠️ [SIMPLIFIED AI] Inventory parser failed:`, parseError);
        }
      }
      
      // Fallback to enhanced text extraction
      const extractedResult = this.extractFromText(textContent);
      console.log(`✅ [SIMPLIFIED AI] Text extraction result:`, extractedResult);
      return extractedResult;
    }
  }

  private extractFromText(text: string): any {
    console.log(`🔍 [SIMPLIFIED AI] Enhanced text extraction from: ${text.substring(0, 200)}...`);
    
    const description = this.extractField(text, 'DESCRIPTION') || 
                       this.extractField(text, 'description') || 
                       this.extractField(text, 'Description') ||
                       'Analysis completed';
    
    const conditionSummary = this.extractField(text, 'CONDITION') || 
                            this.extractField(text, 'condition') ||
                            this.extractField(text, 'Condition') ||
                            this.extractField(text, 'SUMMARY') ||
                            this.extractField(text, 'summary') || '';
    
    const rating = this.extractField(text, 'RATING') || 
                   this.extractField(text, 'rating') ||
                   this.extractField(text, 'Rating') ||
                   this.extractField(text, 'ORDER') ||
                   'fair';
    
    const cleanliness = this.extractField(text, 'CLEANLINESS') || 
                       this.extractField(text, 'cleanliness') ||
                       this.extractField(text, 'Cleanliness') ||
                       this.extractField(text, 'CLEANING') ||
                       'domestic_clean';
    
    const points = this.extractListItems(text);
    
    const result = {
      description: description.trim(),
      condition: {
        summary: conditionSummary.trim(),
        points: points || [],
        rating: this.normalizeRating(rating)
      },
      cleanliness: this.normalizeCleanliness(cleanliness)
    };
    
    console.log(`✅ [SIMPLIFIED AI] Enhanced extraction result:`, result);
    return result;
  }

  private extractField(text: string, fieldName: string): string | null {
    const patterns = [
      // Match "FIELD: content" or "FIELD:content"
      new RegExp(`${fieldName}\\s*:?\\s*([^\\n\\r]+)`, 'i'),
      // Match JSON-like "field": "content"
      new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i'),
      // Match "field = content"
      new RegExp(`${fieldName}\\s*=\\s*([^\\n\\r]+)`, 'i'),
      // Match markdown-style **FIELD**: content
      new RegExp(`\\*\\*${fieldName}\\*\\*\\s*:?\\s*([^\\n\\r]+)`, 'i'),
      // Match section headers ### FIELD
      new RegExp(`#{1,3}\\s*${fieldName}\\s*\\n([^#\\n]+)`, 'i'),
      // Match bracket notation [FIELD]: content
      new RegExp(`\\[${fieldName}\\]\\s*:?\\s*([^\\n\\r]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        // Filter out obvious false matches
        if (extracted.length > 0 && !extracted.match(/^[\{\[\:]+$/)) {
          console.log(`🎯 [SIMPLIFIED AI] Extracted ${fieldName}: ${extracted}`);
          return extracted;
        }
      }
    }
    
    console.log(`❌ [SIMPLIFIED AI] Could not extract ${fieldName} from text`);
    return null;
  }

  private extractListItems(text: string): string[] {
    const listPatterns = [
      /[-•]\s*([^\n]+)/g,
      /\d+\.\s*([^\n]+)/g,
      /\*\s*([^\n]+)/g
    ];
    
    for (const pattern of listPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        return matches.map(match => match[1].trim()).filter(item => item.length > 0);
      }
    }
    
    return [];
  }

  private normalizeRating(rating: string): string {
    const normalizedRating = rating.toLowerCase().trim();
    
    // Map various rating formats to standard values
    if (normalizedRating.includes('good') || normalizedRating.includes('excellent')) return 'good';
    if (normalizedRating.includes('fair') || normalizedRating.includes('acceptable')) return 'fair';
    if (normalizedRating.includes('poor') || normalizedRating.includes('bad') || normalizedRating.includes('damaged')) return 'poor';
    if (normalizedRating.includes('used')) return 'used';
    
    return 'fair'; // Default fallback
  }

  private normalizeCleanliness(cleanliness: string): string {
    const normalizedCleanliness = cleanliness.toLowerCase().trim();
    
    // Map various cleanliness formats to standard values
    if (normalizedCleanliness.includes('domestic') || normalizedCleanliness.includes('clean')) return 'domestic_clean';
    if (normalizedCleanliness.includes('professional') || normalizedCleanliness.includes('deep')) return 'professional_clean';
    if (normalizedCleanliness.includes('dirty') || normalizedCleanliness.includes('requires')) return 'requires_cleaning';
    
    return 'domestic_clean'; // Default fallback
  }

  getModelInfo() {
    return this.modelManager.getModelInfo();
  }
}
