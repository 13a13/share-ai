
/**
 * Unified AI Processor - Single processing pipeline
 */

import { UnifiedPromptManager, ComponentAnalysisContext } from './unified-prompt-manager.ts';
import { UnifiedResponseParser, UnifiedAnalysisResult } from './unified-response-parser.ts';
import { createGeminiRequest, callGeminiApi } from './gemini-api.ts';

export class UnifiedAIProcessor {
  private promptManager: UnifiedPromptManager;
  private responseParser: UnifiedResponseParser;

  constructor() {
    this.promptManager = new UnifiedPromptManager();
    this.responseParser = new UnifiedResponseParser();
  }

  /**
   * Process images using the unified system
   */
  async processWithUnifiedSystem(
    processedImages: string[],
    componentName: string,
    roomType: string,
    apiKey: string
  ): Promise<UnifiedAnalysisResult> {
    const startTime = Date.now();
    
    console.log(`🚀 [UNIFIED AI] Starting unified processing for ${processedImages.length} images`);
    console.log(`📊 [UNIFIED AI] Component: ${componentName}, Room: ${roomType}`);

    // Get component-specific context
    const componentContext = this.promptManager.getComponentContext(componentName);
    
    // Build analysis context
    const analysisContext: ComponentAnalysisContext = {
      componentName,
      roomType,
      imageCount: processedImages.length,
      ...componentContext
    };

    // Generate unified prompt
    const unifiedPrompt = this.promptManager.generateUnifiedPrompt(analysisContext);
    
    console.log(`📝 [UNIFIED AI] Generated unified prompt (${unifiedPrompt.length} chars)`);

    // Create Gemini request with equal image weighting
    const geminiRequest = this.createEqualWeightRequest(unifiedPrompt, processedImages);

    try {
      // Call Gemini 2.0 Flash
      const textResponse = await callGeminiApi(apiKey, geminiRequest);
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ [UNIFIED AI] Gemini 2.0 Flash completed in ${processingTime}ms`);

      // Parse unified response
      const result = this.responseParser.parseUnifiedResponse(textResponse, processingTime);
      
      console.log(`✅ [UNIFIED AI] Unified processing complete:`, {
        parsingMethod: result.processingMetadata.parsingMethod,
        confidence: result.processingMetadata.confidence,
        imageCount: result.analysisMetadata.imageCount,
        isConsistent: result.analysisMetadata.multiImageAnalysis.isConsistent
      });

      return result;
    } catch (error) {
      console.error(`❌ [UNIFIED AI] Processing failed:`, error);
      throw error;
    }
  }

  /**
   * Create request with equal image weighting
   */
  private createEqualWeightRequest(prompt: string, images: string[]): any {
    // Enhanced prompt for equal weighting when multiple images
    let enhancedPrompt = prompt;
    
    if (images.length > 1) {
      enhancedPrompt += `\n\n**EQUAL IMAGE WEIGHTING PROTOCOL:**
All ${images.length} images have equal importance in your analysis. Do not prioritize the first image over others. Synthesize observations from ALL images to form your assessment. If you see different details in different images, combine them into a comprehensive analysis.`;
    }

    return createGeminiRequest(enhancedPrompt, images);
  }

  /**
   * Get processing metadata
   */
  getProcessorInfo(): { version: string; model: string; unified: boolean } {
    return {
      version: '1.0.0',
      model: 'gemini-2.0-flash-exp',
      unified: true
    };
  }
}
