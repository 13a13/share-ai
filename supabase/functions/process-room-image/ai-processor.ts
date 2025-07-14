import { processImagesWithAI } from "./process-images-with-ai.ts";
import { GeminiModelManager } from "./model-manager.ts";
import { CostController } from "./cost-controller.ts";
import { PromptManager } from "./prompt-manager.ts";
import { CrossImageValidator } from "./cross-validation.ts";
import { validateDustDetection } from "./dust-detection.ts";
import { createGeminiRequest, callGeminiApi } from "./gemini-api.ts";
import { parseInventoryResponse } from "./inventory-parser.ts";
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
        'gemini-2.0-flash': 0.02, // Use the correct endpoint name
        // Legacy mappings for backwards compatibility
        'gemini-2.0-flash-exp': 0.02,
        'gemini-2.5-pro-preview-0506': 0.02,
        'gemini-1.5-flash': 0.02
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
    const budgetCheck = await this.costController.checkBudgetBeforeCall('gemini-2.0-flash', estimatedCost);
    
    if (!budgetCheck.allowed) {
      console.warn(`💸 [AI PROCESSOR] Budget constraint: ${budgetCheck.reason}`);
      throw new Error(`Budget limit reached: ${budgetCheck.reason}`);
    }
    
    // Always use Gemini 2.0 Flash (the correct available model)
    const selectedModel = 'gemini-2.0-flash';
    
    console.log(`🤖 [AI PROCESSOR] Using standardized model: ${selectedModel}`);
    
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
      // Use the standardized Gemini API directly
      const request = createGeminiRequest(prompt, processedImages);
      const result = await callGeminiApi(apiKey, request);
      
      // Parse result
      parsedData = this.parseResult(result, shouldUseAdvancedAnalysis, inventoryMode, componentName);
      actualCost = this.costController.config.costPerModelCall[selectedModel] || 0.02;
      
      // Record usage
      this.costController.recordUsage(selectedModel, actualCost);
      
    } catch (error) {
      console.error(`❌ [AI PROCESSOR] Processing failed:`, error);
      // Record failed attempt cost
      actualCost = this.costController.config.costPerModelCall[selectedModel] || 0.02;
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
    const { imageCount } = options;
    
    // Base cost for Gemini 2.0 Flash
    const baseCost = 0.02;
    
    // Adjust for image count (linear scaling)
    const imageCostMultiplier = Math.min(imageCount * 0.05, 1.0);
    
    return baseCost * (1 + imageCostMultiplier);
  }

  private parseResult(textContent: string, advanced: boolean, inventoryMode: boolean, componentName?: string): any {
    console.log(`🔍 [AI PROCESSOR] Parsing result for ${componentName || 'unknown component'}`);
    console.log(`📝 [AI PROCESSOR] Raw AI response (first 1000 chars):`, textContent.substring(0, 1000));
    console.log(`📊 [AI PROCESSOR] Response stats - Length: ${textContent.length}, Mode: ${advanced ? 'advanced' : 'basic'}, Inventory: ${inventoryMode}`);
    
    // Step 1: Try JSON parsing first (for advanced mode)
    if (advanced || textContent.trim().startsWith('{')) {
      try {
        // Clean JSON before parsing
        let cleanedContent = textContent.trim();
        
        // Extract JSON from markdown blocks if present
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1].trim();
          console.log(`📝 [AI PROCESSOR] Extracted JSON from markdown block`);
        }
        
        const jsonResult = JSON.parse(cleanedContent);
        console.log(`✅ [AI PROCESSOR] JSON parsed successfully:`, jsonResult);
        
        // Validate and enhance JSON result
        const validatedResult = this.validateAndEnhanceResult(jsonResult, componentName);
        console.log(`🔧 [AI PROCESSOR] Validated JSON result:`, validatedResult);
        return validatedResult;
      } catch (jsonError) {
        console.log(`❌ [AI PROCESSOR] JSON parsing failed:`, jsonError.message);
      }
    }
    
    // Step 2: Try inventory parser for structured text responses
    if (inventoryMode || !advanced) {
      try {
        const inventoryResult = parseInventoryResponse(textContent);
        console.log(`✅ [AI PROCESSOR] Inventory parser result:`, inventoryResult);
        
        if (inventoryResult && this.hasValidContent(inventoryResult)) {
          const enhancedResult = this.enhanceInventoryResult(inventoryResult, componentName);
          console.log(`🔧 [AI PROCESSOR] Enhanced inventory result:`, enhancedResult);
          return enhancedResult;
        }
      } catch (parseError) {
        console.warn(`⚠️ [AI PROCESSOR] Inventory parser failed:`, parseError.message);
      }
    }
    
    // Step 3: Enhanced text extraction with intelligent content detection
    console.log(`🔄 [AI PROCESSOR] Falling back to enhanced text extraction`);
    const extractedResult = this.enhancedTextExtraction(textContent, componentName);
    console.log(`✅ [AI PROCESSOR] Enhanced text extraction result:`, extractedResult);
    
    // Step 4: Validate final result and ensure it's not empty
    const finalResult = this.ensureValidResult(extractedResult, componentName, textContent);
    console.log(`🎯 [AI PROCESSOR] Final validated result:`, finalResult);
    
    return finalResult;
  }

  private extractFromText(text: string): any {
    console.log(`🔍 [AI PROCESSOR] Enhanced text extraction from: ${text.substring(0, 200)}...`);
    
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
    
    console.log(`✅ [AI PROCESSOR] Enhanced extraction result:`, result);
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
          console.log(`🎯 [AI PROCESSOR] Extracted ${fieldName}: ${extracted}`);
          return extracted;
        }
      }
    }
    
    console.log(`❌ [AI PROCESSOR] Could not extract ${fieldName} from text`);
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

  // Enhanced helper methods for improved parsing
  private validateAndEnhanceResult(result: any, componentName?: string): any {
    console.log(`🔧 [AI PROCESSOR] Validating and enhancing JSON result`);
    
    const enhanced = {
      description: this.ensureStringField(result.description, componentName ? `${componentName} analysis completed` : 'Analysis completed'),
      condition: {
        summary: this.ensureStringField(result.condition?.summary, ''),
        points: Array.isArray(result.condition?.points) ? result.condition.points : [],
        rating: this.normalizeRating(result.condition?.rating || 'fair')
      },
      cleanliness: this.normalizeCleanliness(result.cleanliness || 'domestic_clean'),
      notes: this.ensureStringField(result.notes, '')
    };
    
    // Add crossAnalysis if it exists (for advanced mode)
    if (result.crossAnalysis) {
      enhanced.crossAnalysis = result.crossAnalysis;
    }
    
    return enhanced;
  }
  
  private hasValidContent(result: any): boolean {
    if (!result) return false;
    
    const hasDescription = result.description && result.description.trim().length > 0;
    const hasCondition = result.condition && (
      (result.condition.summary && result.condition.summary.trim().length > 0) ||
      (Array.isArray(result.condition.points) && result.condition.points.length > 0)
    );
    
    return hasDescription || hasCondition;
  }
  
  private enhanceInventoryResult(result: any, componentName?: string): any {
    return {
      description: this.ensureStringField(result.description, componentName ? `${componentName} inspection completed` : 'Inspection completed'),
      condition: {
        summary: this.ensureStringField(result.condition?.summary, ''),
        points: Array.isArray(result.condition?.points) ? result.condition.points : [],
        rating: this.normalizeRating(result.condition?.rating || 'fair')
      },
      cleanliness: this.normalizeCleanliness(result.cleanliness || 'domestic_clean'),
      notes: this.ensureStringField(result.notes, '')
    };
  }
  
  private enhancedTextExtraction(text: string, componentName?: string): any {
    console.log(`🔍 [AI PROCESSOR] Enhanced text extraction with intelligent content detection`);
    
    // Try multiple extraction strategies
    const strategies = [
      () => this.extractStructuredFormat(text),
      () => this.extractNaturalLanguageContent(text),
      () => this.extractFromText(text) // Fallback to original method
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (this.hasValidContent(result)) {
          console.log(`✅ [AI PROCESSOR] Successful extraction with strategy`);
          return this.validateAndEnhanceResult(result, componentName);
        }
      } catch (error) {
        console.warn(`⚠️ [AI PROCESSOR] Extraction strategy failed:`, error.message);
      }
    }
    
    // If all strategies fail, return original method result
    return this.extractFromText(text);
  }
  
  private extractStructuredFormat(text: string): any {
    console.log(`🔍 [AI PROCESSOR] Trying structured format extraction`);
    
    // Look for any structured content patterns
    const sections = text.split(/\n\s*\n/); // Split by double newlines
    
    let description = '';
    let conditionSummary = '';
    let rating = 'fair';
    let cleanliness = 'domestic_clean';
    const points: string[] = [];
    
    for (const section of sections) {
      const sectionLower = section.toLowerCase();
      
      // Extract description from first meaningful paragraph
      if (!description && section.length > 20 && !sectionLower.includes('condition') && !sectionLower.includes('rating') && !sectionLower.includes('cleanliness')) {
        const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length > 0) {
          description = sentences[0].trim();
        }
      }
      
      // Extract condition information
      if (sectionLower.includes('condition') || sectionLower.includes('wear') || sectionLower.includes('damage')) {
        const lines = section.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines) {
          if (line.includes('-') || line.includes('•') || line.includes('*')) {
            points.push(line.replace(/^[-•*\s]+/, '').trim());
          } else if (!conditionSummary && line.length > 15) {
            conditionSummary = line.trim();
          }
        }
      }
      
      // Extract rating information
      if (sectionLower.includes('rating') || sectionLower.includes('order') || sectionLower.includes('condition')) {
        const ratingMatch = section.match(/(excellent|good|fair|poor|damaged|used order|fair order|good order)/i);
        if (ratingMatch) {
          rating = ratingMatch[1];
        }
      }
      
      // Extract cleanliness information
      if (sectionLower.includes('clean') || sectionLower.includes('dirty')) {
        const cleanMatch = section.match(/(professional clean|domestic clean|not clean|requires cleaning)/i);
        if (cleanMatch) {
          cleanliness = cleanMatch[1];
        }
      }
    }
    
    return {
      description: description || '',
      condition: {
        summary: conditionSummary || '',
        points: points,
        rating: this.normalizeRating(rating)
      },
      cleanliness: this.normalizeCleanliness(cleanliness)
    };
  }
  
  private extractNaturalLanguageContent(text: string): any {
    console.log(`🔍 [AI PROCESSOR] Trying natural language content extraction`);
    
    // Extract meaningful content from natural language responses
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let description = '';
    let conditionSummary = '';
    let rating = 'fair';
    let cleanliness = 'domestic_clean';
    
    // Find the most descriptive sentence for description
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase().trim();
      
      // Skip sentences that are clearly not descriptions
      if (sentenceLower.includes('analysis') || sentenceLower.includes('assessment') || sentenceLower.includes('inspection')) {
        continue;
      }
      
      // Look for sentences that describe the component
      if (sentenceLower.includes('appears') || sentenceLower.includes('shows') || sentenceLower.includes('displays') || 
          sentenceLower.includes('feature') || sentenceLower.includes('material') || sentenceLower.includes('color')) {
        if (!description || sentence.length > description.length) {
          description = sentence.trim();
        }
      }
    }
    
    // Extract condition from sentences mentioning condition-related terms
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase().trim();
      
      if (sentenceLower.includes('condition') || sentenceLower.includes('wear') || sentenceLower.includes('damage') ||
          sentenceLower.includes('scratch') || sentenceLower.includes('mark') || sentenceLower.includes('stain')) {
        if (!conditionSummary || sentence.length > conditionSummary.length) {
          conditionSummary = sentence.trim();
        }
      }
    }
    
    // Extract rating from the text
    const ratingMatch = text.match(/(excellent|good|fair|poor|damaged)/i);
    if (ratingMatch) {
      rating = ratingMatch[1];
    }
    
    // Extract cleanliness
    const cleanMatch = text.match(/(professional clean|domestic clean|not clean|dirty|clean)/i);
    if (cleanMatch) {
      cleanliness = cleanMatch[1];
    }
    
    return {
      description: description || '',
      condition: {
        summary: conditionSummary || '',
        points: [],
        rating: this.normalizeRating(rating)
      },
      cleanliness: this.normalizeCleanliness(cleanliness)
    };
  }
  
  private ensureValidResult(result: any, componentName?: string, originalText?: string): any {
    console.log(`🔧 [AI PROCESSOR] Ensuring result is valid and complete`);
    
    // If result is completely empty, create a meaningful one from the original text
    if (!this.hasValidContent(result)) {
      console.log(`⚠️ [AI PROCESSOR] Result has no valid content, creating fallback`);
      
      const fallbackDescription = this.generateFallbackDescription(componentName, originalText);
      const fallbackCondition = this.generateFallbackCondition(originalText);
      
      return {
        description: fallbackDescription,
        condition: {
          summary: fallbackCondition.summary,
          points: fallbackCondition.points,
          rating: fallbackCondition.rating
        },
        cleanliness: 'domestic_clean',
        notes: 'Analysis completed with fallback processing'
      };
    }
    
    // Enhance existing result to ensure all fields are populated
    return {
      description: this.ensureStringField(result.description, componentName ? `${componentName} analyzed successfully` : 'Component analyzed successfully'),
      condition: {
        summary: this.ensureStringField(result.condition?.summary, 'Component appears to be in functional condition'),
        points: Array.isArray(result.condition?.points) ? result.condition.points : [],
        rating: this.normalizeRating(result.condition?.rating || 'fair')
      },
      cleanliness: this.normalizeCleanliness(result.cleanliness || 'domestic_clean'),
      notes: this.ensureStringField(result.notes, '')
    };
  }
  
  private generateFallbackDescription(componentName?: string, originalText?: string): string {
    if (originalText && originalText.length > 50) {
      // Try to extract the first meaningful sentence
      const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 15);
      if (sentences.length > 0) {
        return sentences[0].trim().substring(0, 100) + (sentences[0].length > 100 ? '...' : '');
      }
    }
    
    return componentName ? `${componentName} has been inspected and documented` : 'Component inspection completed successfully';
  }
  
  private generateFallbackCondition(originalText?: string): { summary: string; points: string[]; rating: string } {
    let summary = 'Component condition has been assessed';
    const points: string[] = [];
    let rating = 'fair';
    
    if (originalText) {
      // Look for any condition indicators in the text
      const conditionWords = ['excellent', 'good', 'fair', 'poor', 'damaged', 'worn', 'scratched', 'stained'];
      for (const word of conditionWords) {
        if (originalText.toLowerCase().includes(word)) {
          rating = word;
          summary = `Component shows signs of ${word} condition`;
          break;
        }
      }
      
      // Extract any bullet points or issues mentioned
      const bulletMatches = originalText.match(/[-•*]\s*([^\n]+)/g);
      if (bulletMatches) {
        points.push(...bulletMatches.map(match => match.replace(/^[-•*\s]+/, '').trim()).slice(0, 3));
      }
    }
    
    return {
      summary,
      points,
      rating: this.normalizeRating(rating)
    };
  }
  
  private ensureStringField(value: any, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return fallback;
  }

  getCostSummary() {
    return this.costController.getUsageSummary();
  }
}
