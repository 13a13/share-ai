/**
 * Simplified AI Processor - Exclusively uses Gemini 2.0 Flash
 * Updated to use the standardized Gemini API
 */

import { SimplifiedModelManager } from "./simplified-model-manager.ts";
import { PromptManager } from "./prompt-manager.ts";
import { CrossImageValidator } from "./cross-validation.ts";
import { createGeminiRequest } from "./gemini-api.ts";
import { parseUniversalResponse } from "./universal-prompt.ts";
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
    
    // Generate universal prompt for Gemini 2.0 Flash
    const prompt = this.promptManager.getPrompt(
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
      
      // Parse result using universal parser
      parsedData = parseUniversalResponse(result);
      
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
    
    // Universal response already includes contamination analysis
    
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

  // Parsing is now handled by universal parser

  getModelInfo() {
    return this.modelManager.getModelInfo();
  }
}
