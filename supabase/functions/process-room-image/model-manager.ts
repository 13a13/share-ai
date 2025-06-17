
import { GeminiRequest } from "./gemini-api.ts";

export interface ModelConfig {
  primary: string;
  fallback: string;
  costOptimized: string;
  features: {
    supportsBatch: boolean;
    maxImages: number;
    maxTokens: number;
    costPerRequest: number;
    rateLimit: number; // requests per minute
  };
}

export interface ModelCallOptions {
  preferCostOptimized?: boolean;
  maxRetries?: number;
  timeout?: number;
  budgetLimit?: number;
}

export class GeminiModelManager {
  private models: Record<string, ModelConfig> = {
    'gemini-2.5-pro-preview-0506': {
      primary: 'gemini-2.5-pro-preview-0506',
      fallback: 'gemini-1.5-flash',
      costOptimized: 'gemini-1.5-flash',
      features: {
        supportsBatch: true,
        maxImages: 20,
        maxTokens: 8192,
        costPerRequest: 0.05,
        rateLimit: 10
      }
    },
    'gemini-1.5-flash': {
      primary: 'gemini-1.5-flash',
      fallback: 'gemini-1.5-flash',
      costOptimized: 'gemini-1.5-flash',
      features: {
        supportsBatch: true,
        maxImages: 15,
        maxTokens: 8192,
        costPerRequest: 0.01,
        rateLimit: 30
      }
    }
  };

  private requestCount: Map<string, number> = new Map();
  private lastResetTime = Date.now();

  async callWithFallback(
    apiKey: string,
    request: GeminiRequest,
    options: ModelCallOptions = {}
  ): Promise<any> {
    const {
      preferCostOptimized = false,
      maxRetries = 2,
      timeout = 45000,
      budgetLimit
    } = options;
    
    console.log(`🤖 [MODEL MANAGER] Starting call with fallback capability`);
    
    // Determine model priority based on request characteristics and preferences
    const modelPriority = this.getModelPriority(request, preferCostOptimized, budgetLimit);
    console.log(`📋 [MODEL MANAGER] Model priority order:`, modelPriority);
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < modelPriority.length && i < maxRetries; i++) {
      const modelName = modelPriority[i];
      
      try {
        // Check rate limits
        if (!this.checkRateLimit(modelName)) {
          console.warn(`⚠️ [MODEL MANAGER] Rate limit exceeded for ${modelName}, trying next model`);
          continue;
        }
        
        console.log(`🚀 [MODEL MANAGER] Attempting request with model: ${modelName}`);
        
        // Adjust request based on model capabilities
        const adjustedRequest = this.adjustRequestForModel(request, modelName);
        
        const result = await Promise.race([
          this.callSpecificModel(apiKey, adjustedRequest, modelName),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        // Record successful usage
        this.recordModelUsage(modelName);
        
        console.log(`✅ [MODEL MANAGER] Success with model: ${modelName}`);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [MODEL MANAGER] Model ${modelName} failed:`, error);
        
        // If this is the last attempt, we'll throw the error after the loop
        if (i < modelPriority.length - 1 && i < maxRetries - 1) {
          // Exponential backoff before trying next model
          const delay = Math.min(1000 * Math.pow(2, i), 5000);
          console.log(`⏳ [MODEL MANAGER] Waiting ${delay}ms before trying next model`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all models failed, throw the last error
    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private getModelPriority(
    request: GeminiRequest, 
    preferCostOptimized: boolean, 
    budgetLimit?: number
  ): string[] {
    const imageCount = request.contents[0].parts.filter(p => p.inline_data).length;
    const requestComplexity = this.assessRequestComplexity(request);
    
    console.log(`📊 [MODEL MANAGER] Request analysis:`, {
      imageCount,
      complexity: requestComplexity,
      preferCostOptimized,
      budgetLimit
    });
    
    // Budget considerations
    if (budgetLimit && budgetLimit < 0.03) {
      console.log(`💰 [MODEL MANAGER] Budget constraint detected, preferring cost-optimized model`);
      return ['gemini-1.5-flash'];
    }
    
    // Cost optimization preference
    if (preferCostOptimized) {
      return ['gemini-1.5-flash', 'gemini-2.5-pro-preview-0506'];
    }
    
    // High complexity or many images favor the pro model
    if (requestComplexity === 'high' || imageCount > 8) {
      return ['gemini-2.5-pro-preview-0506', 'gemini-1.5-flash'];
    }
    
    // Medium complexity can use either, but start with cost-effective
    if (requestComplexity === 'medium' || imageCount > 3) {
      return ['gemini-1.5-flash', 'gemini-2.5-pro-preview-0506'];
    }
    
    // Simple requests use flash model
    return ['gemini-1.5-flash'];
  }

  private assessRequestComplexity(request: GeminiRequest): 'low' | 'medium' | 'high' {
    const promptText = request.contents[0].parts.find(p => p.text)?.text || '';
    const imageCount = request.contents[0].parts.filter(p => p.inline_data).length;
    const maxTokens = request.generationConfig.maxOutputTokens;
    
    // High complexity indicators
    if (
      imageCount > 10 ||
      maxTokens > 2000 ||
      promptText.includes('ADVANCED') ||
      promptText.includes('CROSS-VALIDATION') ||
      promptText.includes('ENHANCED')
    ) {
      return 'high';
    }
    
    // Medium complexity indicators
    if (
      imageCount > 5 ||
      maxTokens > 1000 ||
      promptText.includes('BATCH') ||
      promptText.includes('MULTI')
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private checkRateLimit(modelName: string): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Reset counter if more than a minute has passed
    if (now - this.lastResetTime > oneMinute) {
      this.requestCount.clear();
      this.lastResetTime = now;
    }
    
    const currentCount = this.requestCount.get(modelName) || 0;
    const limit = this.models[modelName]?.features.rateLimit || 10;
    
    return currentCount < limit;
  }

  private recordModelUsage(modelName: string): void {
    const currentCount = this.requestCount.get(modelName) || 0;
    this.requestCount.set(modelName, currentCount + 1);
  }

  private adjustRequestForModel(request: GeminiRequest, modelName: string): GeminiRequest {
    const modelConfig = this.models[modelName];
    if (!modelConfig) {
      console.warn(`⚠️ [MODEL MANAGER] Unknown model ${modelName}, using request as-is`);
      return request;
    }
    
    // Clone the request to avoid mutation
    const adjustedRequest = JSON.parse(JSON.stringify(request));
    
    console.log(`🔧 [MODEL MANAGER] Adjusting request for ${modelName}`);
    
    // Limit images based on model capability
    const imageParts = adjustedRequest.contents[0].parts.filter((p: any) => p.inline_data);
    if (imageParts.length > modelConfig.features.maxImages) {
      console.log(`✂️ [MODEL MANAGER] Trimming images from ${imageParts.length} to ${modelConfig.features.maxImages}`);
      const textParts = adjustedRequest.contents[0].parts.filter((p: any) => p.text);
      const limitedImageParts = imageParts.slice(0, modelConfig.features.maxImages);
      adjustedRequest.contents[0].parts = [...textParts, ...limitedImageParts];
    }
    
    // Adjust token limits
    const originalMaxTokens = adjustedRequest.generationConfig.maxOutputTokens;
    adjustedRequest.generationConfig.maxOutputTokens = Math.min(
      originalMaxTokens,
      modelConfig.features.maxTokens
    );
    
    if (originalMaxTokens !== adjustedRequest.generationConfig.maxOutputTokens) {
      console.log(`🎚️ [MODEL MANAGER] Adjusted max tokens from ${originalMaxTokens} to ${adjustedRequest.generationConfig.maxOutputTokens}`);
    }
    
    // Adjust generation config for pro model
    if (modelName.includes('2.5-pro')) {
      adjustedRequest.generationConfig.temperature = Math.min(
        adjustedRequest.generationConfig.temperature,
        0.3
      );
      adjustedRequest.generationConfig.topP = Math.min(
        adjustedRequest.generationConfig.topP,
        0.95
      );
    }
    
    return adjustedRequest;
  }

  private async callSpecificModel(apiKey: string, request: GeminiRequest, modelName: string): Promise<any> {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    console.log(`📡 [MODEL MANAGER] Calling ${modelName} API`);
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [MODEL MANAGER] ${modelName} API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`${modelName} API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Enhanced response validation
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(`No candidates returned from ${modelName}`);
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error(`No content parts returned from ${modelName}`);
    }
    
    const textContent = candidate.content.parts[0].text;
    if (!textContent) {
      throw new Error(`No text content returned from ${modelName}`);
    }
    
    console.log(`✅ [MODEL MANAGER] ${modelName} returned ${textContent.length} characters`);
    return textContent;
  }

  getModelInfo(modelName: string): ModelConfig | null {
    return this.models[modelName] || null;
  }

  getAllModels(): string[] {
    return Object.keys(this.models);
  }
}
