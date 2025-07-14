
/**
 * Advanced AI Processor - Gemini 2.0 Flash Optimized
 * Implements enhanced defect detection with robust processing
 */

import { SimplifiedModelManager } from "./simplified-model-manager.ts";
import { ModernizedPromptManager, PromptType } from "./modernized-prompt-manager.ts";
import { EnhancedJSONParser, ParseResult } from "./enhanced-json-parser.ts";
import { createGeminiRequest } from "./gemini-api.ts";

export interface ProcessingOptions {
  componentName: string;
  roomType: string;
  inventoryMode: boolean;
  useAdvancedAnalysis: boolean;
  imageCount: number;
}

export interface ProcessingResult {
  parsedData: any;
  modelUsed: string;
  processingTime: number;
  validationResult?: any;
  parsingMethod: string;
  confidence: number;
}

export class AdvancedAIProcessor {
  private modelManager = new SimplifiedModelManager();
  private promptManager = new ModernizedPromptManager();
  private jsonParser = new EnhancedJSONParser();

  async processWithGemini25Pro(
    processedImages: string[],
    options: ProcessingOptions,
    apiKey: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`🚀 [ADVANCED AI] Starting Gemini 2.0 Flash processing for ${options.imageCount} images`);

    // Determine analysis type based on requirements
    const analysisType = this.determineAnalysisType(options);
    console.log(`📊 [ADVANCED AI] Analysis type selected: ${analysisType}`);

    // Generate optimized prompt
    const promptText = this.promptManager.getPrompt(
      'gemini-2.0-flash',
      analysisType,
      options.componentName || 'component',
      options.roomType,
      options.imageCount
    );

    // Create and send request
    const geminiRequest = createGeminiRequest(promptText, processedImages);

    try {
      const textContent = await this.modelManager.callGemini25Pro(apiKey, geminiRequest, {
        maxRetries: 3,
        timeout: 60000
      });

      // Enhanced JSON parsing with fallbacks
      const parseResult = this.jsonParser.parseWithFallbacks(textContent);
      
      if (!parseResult.success) {
        console.error(`❌ [ADVANCED AI] All parsing strategies failed`);
        throw new Error('Failed to parse AI response');
      }

      console.log(`✅ [ADVANCED AI] Parsing successful with method: ${parseResult.method}, confidence: ${parseResult.confidence}`);

      // Apply validation and enhancement
      const validatedData = this.applyAdvancedValidation(parseResult.data, options);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [ADVANCED AI] Processing complete: ${processingTime}ms`);

      return {
        parsedData: validatedData,
        modelUsed: 'gemini-2.0-flash',
        processingTime,
        parsingMethod: parseResult.method,
        confidence: parseResult.confidence,
        validationResult: {
          enhancedDefectDetection: analysisType === 'defect_analysis',
          multiPerspectiveValidation: options.imageCount > 1,
          falsePositiveScreening: true
        }
      };

    } catch (error) {
      console.error(`❌ [ADVANCED AI] Processing failed:`, error);
      throw error;
    }
  }

  private determineAnalysisType(options: ProcessingOptions): PromptType {
    // Use advanced defect analysis for complex scenarios
    if (options.useAdvancedAnalysis || options.imageCount > 2) {
      return 'defect_analysis';
    }
    
    // Use advanced multi-perspective for multiple images
    if (options.imageCount > 1) {
      return 'advanced';
    }
    
    // Use inventory mode for single image standard analysis
    return 'inventory';
  }

  private applyAdvancedValidation(data: any, options: ProcessingOptions): any {
    console.log(`🔍 [ADVANCED AI] Applying validation and enhancement`);

    // Ensure defect analysis structure exists for advanced processing
    if (options.useAdvancedAnalysis && !data.defects) {
      data.defects = [];
    }

    // Add analysis metadata
    data.analysisMetadata = {
      ...data.analysisMetadata,
      imageCount: options.imageCount,
      enhancedDefectDetection: true,
      multiPerspectiveValidation: options.imageCount > 1,
      falsePositiveScreening: true,
      componentSpecificAnalysis: true,
      geminiModel: 'gemini-2.0-flash'
    };

    // Validate defects structure if present
    if (data.defects && Array.isArray(data.defects)) {
      data.defects = data.defects.map((defect: any) => this.validateDefectStructure(defect));
    }

    // Validate cleanliness structure if present
    if (data.cleanliness && typeof data.cleanliness === 'object') {
      data.cleanliness = this.validateCleanlinessStructure(data.cleanliness);
    }

    return data;
  }

  private validateDefectStructure(defect: any): any {
    return {
      id: defect.id || `defect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: defect.category || 'surface',
      type: defect.type || 'general_issue',
      severity: this.validateSeverity(defect.severity),
      confidence: Math.min(Math.max(defect.confidence || 0.7, 0), 1),
      location: defect.location || { area: 'observed', extent: 'localized' },
      description: defect.description || 'Defect identified during inspection',
      supportingEvidence: defect.supportingEvidence || 1,
      repairUrgency: defect.repairUrgency || 'MEDIUM',
      estimatedCost: defect.estimatedCost || 'MEDIUM'
    };
  }

  private validateSeverity(severity: string): string {
    const validSeverities = ['CRITICAL', 'MAJOR', 'MODERATE', 'MINOR', 'TRACE'];
    const upperSeverity = severity?.toUpperCase();
    return validSeverities.includes(upperSeverity) ? upperSeverity : 'MODERATE';
  }

  private validateCleanlinessStructure(cleanliness: any): any {
    if (typeof cleanliness === 'string') {
      return {
        level: this.normalizeCleanlinessLevel(cleanliness),
        objectiveFindings: ['Assessment completed'],
        cleaningRequirement: 'STANDARD'
      };
    }
    
    return {
      level: this.normalizeCleanlinessLevel(cleanliness.level),
      objectiveFindings: cleanliness.objectiveFindings || ['Assessment completed'],
      cleaningRequirement: cleanliness.cleaningRequirement || 'STANDARD'
    };
  }

  private normalizeCleanlinessLevel(level: string): string {
    const normalized = level?.toUpperCase();
    const validLevels = ['PROFESSIONAL', 'STANDARD', 'BELOW_STANDARD'];
    return validLevels.includes(normalized) ? normalized : 'STANDARD';
  }
}
