import { GeminiRequest, callGeminiApi } from "./gemini-api.ts";

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
    'gemini-2.0-flash': {
      primary: 'gemini-2.0-flash', // Use the correct API endpoint name
      fallback: 'gemini-2.0-flash', // No fallback needed
      costOptimized: 'gemini-2.0-flash',
      features: {
        supportsBatch: true,
        maxImages: 20,
        maxTokens: 4096,
        costPerRequest: 0.02, // Estimated cost for 2.0 Flash
        rateLimit: 15
      }
    },
    // Legacy entry for exp model - map to correct endpoint
    'gemini-2.0-flash-exp': {
      primary: 'gemini-2.0-flash',
      fallback: 'gemini-2.0-flash',
      costOptimized: 'gemini-2.0-flash',
      features: {
        supportsBatch: true,
        maxImages: 20,
        maxTokens: 4096,
        costPerRequest: 0.02,
        rateLimit: 15
      }
    },
    'gemini-2.5-pro-preview-0506': {
      primary: 'gemini-2.0-flash',
      fallback: 'gemini-2.0-flash',
      costOptimized: 'gemini-2.0-flash',
      features: {
        supportsBatch: true,
        maxImages: 20,
        maxTokens: 4096,
        costPerRequest: 0.02,
        rateLimit: 15
      }
    },
    'gemini-1.5-flash': {
      primary: 'gemini-2.0-flash',
      fallback: 'gemini-2.0-flash',
      costOptimized: 'gemini-2.0-flash',
      features: {
        supportsBatch: true,
        maxImages: 20,
        maxTokens: 4096,
        costPerRequest: 0.02,
        rateLimit: 15
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
    
    console.log(`🤖 [MODEL MANAGER] Starting call with Gemini 2.0 Flash`);
    
    // Always use Gemini 2.0 Flash now (all models map to it)
    const modelName = 'gemini-2.0-flash';
    
    console.log(`📋 [MODEL MANAGER] Using standardized model: ${modelName}`);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limits
        if (!this.checkRateLimit(modelName)) {
          console.warn(`⚠️ [MODEL MANAGER] Rate limit exceeded for ${modelName}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            continue;
          } else {
            throw new Error(`Rate limit exceeded for ${modelName}`);
          }
        }
        
        console.log(`🚀 [MODEL MANAGER] Attempt ${attempt}/${maxRetries} with model: ${modelName}`);
        
        // Adjust request based on model capabilities
        const adjustedRequest = this.adjustRequestForModel(request, modelName);
        
        const result = await Promise.race([
          callGeminiApi(apiKey, adjustedRequest),
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
        if (attempt < maxRetries) {
          // Check if it's a permanent error (don't retry)
          if (error.message.includes('Invalid API key') || 
              error.message.includes('API access forbidden') ||
              error.message.includes('Invalid request format')) {
            console.error(`❌ [MODEL MANAGER] Permanent error detected, stopping retries`);
            break;
          }
          
          // Exponential backoff before retrying
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ [MODEL MANAGER] Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all attempts failed, throw the last error
    throw new Error(`Gemini 2.0 Flash failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
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
    
    // Optimize generation config for Gemini 2.0 Flash
    adjustedRequest.generationConfig.temperature = 0.2;
    adjustedRequest.generationConfig.topP = 0.95;
    adjustedRequest.generationConfig.topK = 40;
    
    return adjustedRequest;
  }

  getModelInfo(modelName: string): ModelConfig | null {
    return this.models[modelName] || null;
  }

  getAllModels(): string[] {
    return Object.keys(this.models);
  }
}
