
/**
 * Standardized Model Manager - Uses Gemini 2.0 Flash exclusively
 * Consistent with gemini-api.ts implementation
 */

import { GeminiRequest, callGeminiApi } from "./gemini-api.ts";

export interface ModelCallOptions {
  maxRetries?: number;
  timeout?: number;
}

export class SimplifiedModelManager {
  private readonly MODEL_NAME = 'gemini-2.0-flash'; // The correct available endpoint
  private readonly MAX_IMAGES = 20;
  private readonly MAX_TOKENS = 4096; // Aligned with gemini-api.ts
  private readonly RATE_LIMIT = 15; // Reasonable limit for 2.0 Flash
  
  private requestCount = 0;
  private lastResetTime = Date.now();

  /**
   * Call Gemini 2.0 Flash with enhanced retry logic
   * Uses the standardized callGeminiApi function
   */
  async callGemini2Flash(
    apiKey: string,
    request: GeminiRequest,
    options: ModelCallOptions = {}
  ): Promise<any> {
    const { maxRetries = 3, timeout = 60000 } = options;
    
    console.log(`🤖 [SIMPLIFIED MODEL] Calling Gemini 2.0 Flash (${this.MODEL_NAME})`);
    
    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error(`Rate limit exceeded for Gemini 2.0 Flash (${this.requestCount}/${this.RATE_LIMIT} requests in last minute)`);
    }
    
    // Adjust request for Gemini 2.0 Flash capabilities
    const adjustedRequest = this.adjustRequestForGemini2Flash(request);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [SIMPLIFIED MODEL] Attempt ${attempt}/${maxRetries} with Gemini 2.0 Flash`);
        
        // Use the standardized API call from gemini-api.ts
        const result = await Promise.race([
          callGeminiApi(apiKey, adjustedRequest),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        // Record successful usage
        this.recordUsage();
        
        console.log(`✅ [SIMPLIFIED MODEL] Success with Gemini 2.0 Flash on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [SIMPLIFIED MODEL] Attempt ${attempt} failed:`, error.message);
        
        // Check if it's a permanent error (don't retry)
        if (error.message.includes('Invalid API key') || 
            error.message.includes('API access forbidden') ||
            error.message.includes('Invalid request format')) {
          console.error(`❌ [SIMPLIFIED MODEL] Permanent error detected, stopping retries`);
          break;
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000;
          const delay = Math.min(baseDelay + jitter, 10000);
          console.log(`⏳ [SIMPLIFIED MODEL] Waiting ${Math.round(delay)}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Gemini 2.0 Flash failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  // Legacy method name for backwards compatibility
  async callGemini25Pro(
    apiKey: string,
    request: GeminiRequest,
    options: ModelCallOptions = {}
  ): Promise<any> {
    console.log(`⚠️ [SIMPLIFIED MODEL] callGemini25Pro is deprecated, redirecting to Gemini 2.0 Flash`);
    return this.callGemini2Flash(apiKey, request, options);
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Reset counter if more than a minute has passed
    if (now - this.lastResetTime > oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    return this.requestCount < this.RATE_LIMIT;
  }

  private recordUsage(): void {
    this.requestCount++;
  }

  private adjustRequestForGemini2Flash(request: GeminiRequest): GeminiRequest {
    console.log(`🔧 [SIMPLIFIED MODEL] Optimizing request for Gemini 2.0 Flash`);
    
    // Clone the request to avoid mutation
    const adjustedRequest = JSON.parse(JSON.stringify(request));
    
    // Limit images to Gemini 2.0 Flash capability
    const imageParts = adjustedRequest.contents[0].parts.filter((p: any) => p.inline_data);
    if (imageParts.length > this.MAX_IMAGES) {
      console.log(`✂️ [SIMPLIFIED MODEL] Trimming images from ${imageParts.length} to ${this.MAX_IMAGES}`);
      const textParts = adjustedRequest.contents[0].parts.filter((p: any) => p.text);
      const limitedImageParts = imageParts.slice(0, this.MAX_IMAGES);
      adjustedRequest.contents[0].parts = [...textParts, ...limitedImageParts];
    }
    
    // Optimize generation config for Gemini 2.0 Flash
    adjustedRequest.generationConfig = {
      ...adjustedRequest.generationConfig,
      maxOutputTokens: Math.min(adjustedRequest.generationConfig.maxOutputTokens, this.MAX_TOKENS),
      temperature: 0.2, // Consistent with gemini-api.ts
      topP: 0.95,
      topK: 40
    };
    
    console.log(`⚙️ [SIMPLIFIED MODEL] Request adjusted:`, {
      imageCount: adjustedRequest.contents[0].parts.filter((p: any) => p.inline_data).length,
      maxTokens: adjustedRequest.generationConfig.maxOutputTokens,
      temperature: adjustedRequest.generationConfig.temperature
    });
    
    return adjustedRequest;
  }

  getModelInfo() {
    return {
      name: this.MODEL_NAME,
      maxImages: this.MAX_IMAGES,
      maxTokens: this.MAX_TOKENS,
      rateLimit: this.RATE_LIMIT
    };
  }
}
