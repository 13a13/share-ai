
/**
 * Simplified Model Manager - Exclusively uses Gemini 2.0 Flash
 * Updated to use the currently available model
 */

import { GeminiRequest } from "./gemini-api.ts";

export interface ModelCallOptions {
  maxRetries?: number;
  timeout?: number;
}

export class SimplifiedModelManager {
  private readonly MODEL_NAME = 'gemini-2.0-flash-exp';
  private readonly MAX_IMAGES = 20;
  private readonly MAX_TOKENS = 8192;
  private readonly RATE_LIMIT = 10; // requests per minute
  
  private requestCount = 0;
  private lastResetTime = Date.now();

  /**
   * Call Gemini 2.0 Flash with retry logic (no fallbacks)
   */
  async callGemini25Pro(
    apiKey: string,
    request: GeminiRequest,
    options: ModelCallOptions = {}
  ): Promise<any> {
    const { maxRetries = 3, timeout = 60000 } = options;
    
    console.log(`🤖 [SIMPLIFIED MODEL] Calling Gemini 2.0 Flash exclusively`);
    
    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for Gemini 2.0 Flash');
    }
    
    // Adjust request for Gemini 2.0 Flash capabilities
    const adjustedRequest = this.adjustRequestForGemini25Pro(request);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [SIMPLIFIED MODEL] Attempt ${attempt}/${maxRetries} with Gemini 2.0 Flash`);
        
        const result = await Promise.race([
          this.callGeminiAPI(apiKey, adjustedRequest),
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
        console.error(`❌ [SIMPLIFIED MODEL] Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ [SIMPLIFIED MODEL] Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Gemini 2.0 Flash failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
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

  private adjustRequestForGemini25Pro(request: GeminiRequest): GeminiRequest {
    console.log(`🔧 [SIMPLIFIED MODEL] Optimizing request for Gemini 2.0 Flash`);
    
    // Clone the request
    const adjustedRequest = JSON.parse(JSON.stringify(request));
    
    // Limit images to Gemini 2.0 Flash capability
    const imageParts = adjustedRequest.contents[0].parts.filter((p: any) => p.inline_data);
    if (imageParts.length > this.MAX_IMAGES) {
      console.log(`✂️ [SIMPLIFIED MODEL] Trimming images from ${imageParts.length} to ${this.MAX_IMAGES}`);
      const textParts = adjustedRequest.contents[0].parts.filter((p: any) => p.text);
      const limitedImageParts = imageParts.slice(0, this.MAX_IMAGES);
      adjustedRequest.contents[0].parts = [...textParts, ...limitedImageParts];
    }
    
    // Optimize for Gemini 2.0 Flash
    adjustedRequest.generationConfig = {
      ...adjustedRequest.generationConfig,
      maxOutputTokens: Math.min(adjustedRequest.generationConfig.maxOutputTokens, this.MAX_TOKENS),
      temperature: 0.2, // Optimal for Gemini 2.0 Flash
      topP: 0.95,
      topK: 40
    };
    
    return adjustedRequest;
  }

  private async callGeminiAPI(apiKey: string, request: GeminiRequest): Promise<any> {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent`;
    
    console.log(`📡 [SIMPLIFIED MODEL] Calling Gemini 2.0 Flash API`);
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [SIMPLIFIED MODEL] Gemini 2.0 Flash API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Gemini 2.0 Flash API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Enhanced response validation
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(`No candidates returned from Gemini 2.0 Flash`);
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error(`No content parts returned from Gemini 2.0 Flash`);
    }
    
    const textContent = candidate.content.parts[0].text;
    if (!textContent) {
      throw new Error(`No text content returned from Gemini 2.0 Flash`);
    }
    
    console.log(`✅ [SIMPLIFIED MODEL] Gemini 2.0 Flash returned ${textContent.length} characters`);
    return textContent;
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
