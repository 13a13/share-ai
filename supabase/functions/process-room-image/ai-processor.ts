
import { processImagesWithAI } from "./process-images-with-ai.ts";
import { GeminiModelManager } from "./model-manager.ts";
import { CostController } from "./cost-controller.ts";
import { PromptManager } from "./prompt-manager.ts";
import { CrossImageValidator } from "./cross-validation.ts";
import { validateDustDetection } from "./dust-detection.ts";
import type { AIProcessingOptions } from './ai-processing-options.ts';

export interface EnhancedAIResult {
  parsedData: any;
  validationResult?: any;
  modelUsed: string;
  costIncurred: number;
  processingTime: number;
  shouldUseAdvancedAnalysis: boolean;
}

export class AIProcessor {
  private modelManager: GeminiModelManager;
  private costController: CostController;
  private promptManager: PromptManager;
  private crossValidator: CrossImageValidator;

  constructor() {
    this.modelManager = new GeminiModelManager();
    this.costController = new CostController({
      dailyBudget: 10.0, // $10 per day
      monthlyBudget: 200.0, // $200 per month
      costPerModelCall: {
        'gemini-2.5-pro-preview-0506': 0.05,
        'gemini-1.5-flash': 0.01
      },
      alertThresholds: {
        warning: 0.8, // 80%
        critical: 0.95 // 95%
      }
    });
    this.promptManager = new PromptManager();
    this.crossValidator = new CrossImageValidator();
  }

  async processImagesWithEnhancedAI(
    processedImages: string[],
    options: AIProcessingOptions,
    apiKey: string
  ): Promise<EnhancedAIResult> {
    const startTime = Date.now();
    console.log(`🚀 [AI PROCESSOR] Starting enhanced processing for ${processedImages.length} images`);
    
    const { componentName, roomType, inventoryMode, useAdvancedAnalysis, imageCount } = options;
    
    // Determine processing strategy
    const shouldUseAdvancedAnalysis = useAdvancedAnalysis && imageCount > 1;
    const complexity = this.assessComplexity(options);
    
    console.log(`📊 [AI PROCESSOR] Processing strategy:`, {
      shouldUseAdvancedAnalysis,
      complexity,
      inventoryMode,
      imageCount
    });
    
    // Budget check
    const estimatedCost = this.estimateProcessingCost(options);
    const budgetCheck = await this.costController.checkBudgetBeforeCall('gemini-2.5-pro-preview-0506', estimatedCost);
    
    if (!budgetCheck.allowed) {
      console.warn(`💸 [AI PROCESSOR] Budget constraint: ${budgetCheck.reason}`);
      throw new Error(`Budget limit reached: ${budgetCheck.reason}`);
    }
    
    // Select optimal model
    const selectedModel = this.costController.shouldUseCostOptimizedModel(
      imageCount,
      complexity,
      budgetCheck.remainingBudget
    );
    
    console.log(`🤖 [AI PROCESSOR] Selected model: ${selectedModel}`);
    
    // Generate optimized prompt
    const promptType = inventoryMode ? 'inventory' : (shouldUseAdvancedAnalysis ? 'advanced' : 'dust');
    const prompt = this.promptManager.getPrompt(
      selectedModel as any,
      promptType,
      componentName || 'component',
      roomType,
      imageCount
    );
    
    let parsedData: any;
    let actualCost = 0;
    
    try {
      // Process with model manager for automatic fallback
      const result = await this.modelManager.callWithFallback(
        apiKey,
        this.createGeminiRequest(prompt, processedImages, shouldUseAdvancedAnalysis),
        {
          preferCostOptimized: budgetCheck.remainingBudget < 0.05,
          maxRetries: 3,
          timeout: 60000
        }
      );
      
      // Parse result
      parsedData = this.parseResult(result, shouldUseAdvancedAnalysis, inventoryMode, componentName);
      actualCost = this.costController.config.costPerModelCall[selectedModel] || 0.01;
      
      // Record usage
      this.costController.recordUsage(selectedModel, actualCost);
      
    } catch (error) {
      console.error(`❌ [AI PROCESSOR] Processing failed:`, error);
      // Record failed attempt cost
      actualCost = this.costController.config.costPerModelCall[selectedModel] || 0.01;
      this.costController.recordUsage(selectedModel, actualCost * 0.5); // Half cost for failed attempts
      throw error;
    }
    
    // Enhanced validation for multi-image analysis
    let validationResult;
    if (shouldUseAdvancedAnalysis && imageCount > 2) {
      console.log(`🔍 [AI PROCESSOR] Running cross-image validation`);
      try {
        const imageMetadata = processedImages.map((_, index) => ({
          lighting: 'standard', // This would be extracted from image analysis
          angle: `perspective_${index + 1}`,
          timestamp: Date.now() - (index * 1000)
        }));
        
        validationResult = await this.crossValidator.validateAcrossImages(
          [parsedData],
          imageMetadata
        );
        
        console.log(`✅ [AI PROCESSOR] Validation completed:`, {
          isConsistent: validationResult.isConsistent,
          confidence: validationResult.confidence,
          recommendedAction: validationResult.recommendedAction
        });
      } catch (validationError) {
        console.warn(`⚠️ [AI PROCESSOR] Validation failed:`, validationError);
      }
    }
    
    // Apply dust detection validation
    if (promptType === 'dust' || inventoryMode) {
      console.log(`🧹 [AI PROCESSOR] Applying dust detection validation`);
      parsedData = validateDustDetection(parsedData);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ [AI PROCESSOR] Enhanced processing complete:`, {
      modelUsed: selectedModel,
      costIncurred: actualCost,
      processingTime: `${processingTime}ms`,
      validationApplied: !!validationResult
    });
    
    return {
      parsedData,
      validationResult,
      modelUsed: selectedModel,
      costIncurred: actualCost,
      processingTime,
      shouldUseAdvancedAnalysis
    };
  }

  private assessComplexity(options: AIProcessingOptions): 'low' | 'medium' | 'high' {
    const { imageCount, useAdvancedAnalysis, componentName } = options;
    
    if (useAdvancedAnalysis || imageCount > 8) return 'high';
    if (imageCount > 4 || (componentName && componentName.length > 20)) return 'medium';
    return 'low';
  }

  private estimateProcessingCost(options: AIProcessingOptions): number {
    const { imageCount, useAdvancedAnalysis } = options;
    
    // Base cost estimation
    let baseCost = 0.01; // Flash model base cost
    
    if (useAdvancedAnalysis || imageCount > 5) {
      baseCost = 0.05; // Pro model cost
    }
    
    // Adjust for image count
    const imageCostMultiplier = Math.min(imageCount * 0.1, 2.0);
    
    return baseCost * (1 + imageCostMultiplier);
  }

  private createGeminiRequest(prompt: string, images: string[], advanced: boolean): any {
    const parts = [
      { text: prompt },
      ...images.map(imageData => ({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageData.startsWith('data:') ? imageData.split(',')[1] : imageData
        }
      }))
    ];

    return {
      contents: [{ parts }],
      generationConfig: {
        temperature: advanced ? 0.2 : 0.4,
        topK: advanced ? 40 : 32,
        topP: advanced ? 0.95 : 1.0,
        maxOutputTokens: advanced ? 2048 : 1024,
      }
    };
  }

  private parseResult(textContent: string, advanced: boolean, inventoryMode: boolean, componentName?: string): any {
    try {
      // Try JSON parsing first
      return JSON.parse(textContent);
    } catch {
      // Fallback to text parsing
      console.log(`📝 [AI PROCESSOR] JSON parsing failed, using text extraction`);
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

  getCostSummary() {
    return this.costController.getUsageSummary();
  }
}
