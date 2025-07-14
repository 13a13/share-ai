/**
 * Simplified AI Processor - Exclusively uses Gemini 2.0 Flash
 * Updated to use the standardized Gemini API
 */

import { SimplifiedModelManager } from "./simplified-model-manager.ts";
import { PromptManager } from "./prompt-manager.ts";
import { CrossImageValidator } from "./cross-validation.ts";
import { validateDustDetection } from "./dust-detection.ts";
import { createGeminiRequest } from "./gemini-api.ts";
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
      'gemini-2.0-flash-exp' as any,
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
      modelUsed: 'gemini-2.0-flash-exp',
      processingTime
    };
  }

  private parseResult(textContent: string, advanced: boolean, inventoryMode: boolean, componentName?: string): any {
    try {
      // Try JSON parsing first
      return JSON.parse(textContent);
    } catch {
      // Fallback to text parsing
      console.log(`📝 [SIMPLIFIED AI] JSON parsing failed, using text extraction`);
      return this.extractFromText(textContent);
    }
  }

  private extractFromText(text: string): any {
    const description = this.extractField(text, 'DESCRIPTION') || 
                       this.extractField(text, 'description') || 
                       'Analysis completed';
    
    const conditionSummary = this.extractField(text, 'CONDITION') || 
                            this.extractField(text, 'summary') || '';
    
    const rating = this.extractField(text, 'RATING') || 
                   this.extractField(text, 'rating') || 'fair';
    
    const cleanliness = this.extractField(text, 'CLEANLINESS') || 
                       this.extractField(text, 'cleanliness') || 'domestic_clean';
    
    return {
      description,
      condition: {
        summary: conditionSummary,
        points: this.extractListItems(text) || [],
        rating: rating.toLowerCase()
      },
      cleanliness: cleanliness.toLowerCase()
    };
  }

  private extractField(text: string, fieldName: string): string | null {
    const patterns = [
      new RegExp(`${fieldName}:?\\s*([^\\n]+)`, 'i'),
      new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i'),
      new RegExp(`${fieldName}\\s*=\\s*([^\\n]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
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

  getModelInfo() {
    return this.modelManager.getModelInfo();
  }
}
