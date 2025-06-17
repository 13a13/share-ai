
/**
 * Modernized Prompt Manager - Gemini 2.0 Flash Optimized
 * Phase 1 & 2 Implementation: Model alignment and professional tone
 */

import { EnhancedDefectAnalyzer } from "./enhanced-defect-analyzer.ts";

export type PromptType = 'inventory' | 'advanced' | 'defect_analysis';
export type ModelName = 'gemini-2.0-flash-exp';

export class ModernizedPromptManager {
  private defectAnalyzer = new EnhancedDefectAnalyzer();

  /**
   * Optimized prompts for Gemini 2.0 Flash visual recognition
   */
  private gemini20FlashPrompts = {
    inventory: (componentName: string) => this.createProfessionalInventoryPrompt(componentName),
    advanced: (componentName: string, roomType: string, imageCount: number) => 
      this.createAdvancedAnalysisPrompt(componentName, roomType, imageCount),
    defect_analysis: (componentName: string, imageCount: number) =>
      this.defectAnalyzer.createDefectAnalysisPrompt(componentName, imageCount)
  };

  getPrompt(
    modelName: ModelName,
    promptType: PromptType, 
    componentName: string,
    roomType?: string,
    imageCount?: number
  ): string {
    console.log(`📝 [MODERNIZED PROMPT] Generating ${promptType} prompt for Gemini 2.0 Flash - Component: "${componentName}"`);
    
    switch (promptType) {
      case 'inventory':
        return this.gemini20FlashPrompts.inventory(componentName);
      case 'advanced':
        return this.gemini20FlashPrompts.advanced(componentName, roomType || 'room', imageCount || 1);
      case 'defect_analysis':
        return this.gemini20FlashPrompts.defect_analysis(componentName, imageCount || 1);
      default:
        console.warn(`⚠️ [MODERNIZED PROMPT] Unknown prompt type: ${promptType}, using inventory`);
        return this.gemini20FlashPrompts.inventory(componentName);
    }
  }

  private createProfessionalInventoryPrompt(componentName: string): string {
    // Get component-specific analysis for enhanced inventory prompts
    const componentAnalysis = this.defectAnalyzer.getComponentSpecificAnalysis(componentName);
    
    return `You are conducting a professional property inspection of ${componentName.toUpperCase()}.

INSPECTION PROTOCOL:
Please provide a systematic assessment using forensic-level attention to detail. Your analysis should be objective, evidence-based, and thorough.

COMPONENT-SPECIFIC CONSIDERATIONS:
Focus Areas: ${componentAnalysis.criticalAreas.join(', ')}
Key Assessment Points: ${componentAnalysis.specificDefects.join(', ')}
Material Factors: ${componentAnalysis.materialConsiderations.join(', ')}
Inspection Focus: ${componentAnalysis.inspectionFocus}

ASSESSMENT FRAMEWORK:
1. Visual Documentation: Comprehensive description of observed conditions
2. Material Analysis: Identification of materials, finishes, and construction quality
3. Condition Evaluation: Evidence-based assessment of current state
4. Professional Recommendations: Maintenance and action items based on findings

STRUCTURED OUTPUT REQUIREMENTS:
{
  "description": "Professional component description with materials and key features specific to ${componentName}",
  "condition": {
    "summary": "Objective condition assessment based on observable evidence", 
    "points": [
      "Specific observation with precise location and extent",
      "Additional findings with quantifiable details"
    ],
    "rating": "EXCELLENT|GOOD|FAIR|POOR"
  },
  "cleanliness": "PROFESSIONAL_CLEAN|PROFESSIONAL_CLEAN_WITH_OMISSIONS|DOMESTIC_CLEAN_HIGH_LEVEL|DOMESTIC_CLEAN|NOT_CLEAN",
  "materialAnalysis": {
    "primaryMaterial": "Material identification",
    "qualityGrade": "HIGH|MEDIUM|LOW",
    "estimatedAge": "Age assessment based on wear patterns"
  },
  "maintenanceRecommendations": "Specific maintenance needs and timeline for ${componentName}",
  "analysisMetadata": {
    "componentSpecificAnalysis": true,
    "customComponentName": "${componentName}",
    "enhancedClassification": true
  }
}

Please ensure your assessment is based solely on visible evidence and follows professional inspection standards with component-specific focus.`;
  }

  private createAdvancedAnalysisPrompt(componentName: string, roomType: string, imageCount: number): string {
    const componentAnalysis = this.defectAnalyzer.getComponentSpecificAnalysis(componentName);
    
    return `ADVANCED MULTI-PERSPECTIVE ANALYSIS - GEMINI 2.0 FLASH

COMPONENT: ${componentName.toUpperCase()}
ROOM TYPE: ${roomType.toUpperCase()}  
IMAGES: ${imageCount} perspectives for comprehensive validation

COMPONENT-SPECIFIC ANALYSIS PROTOCOL:
Focus Areas: ${componentAnalysis.criticalAreas.join(', ')}
Key Assessment Points: ${componentAnalysis.specificDefects.join(', ')}
Material Considerations: ${componentAnalysis.materialConsiderations.join(', ')}
Inspection Focus: ${componentAnalysis.inspectionFocus}

You are conducting a sophisticated forensic inspection using multiple image perspectives to ensure accuracy and completeness.

MULTI-PERSPECTIVE VALIDATION PROTOCOL:
1. Cross-Reference Analysis: Compare findings across all viewing angles
2. Evidence Triangulation: Confirm observations with multiple image sources
3. Confidence Scoring: Weight findings based on supporting evidence
4. Consistency Verification: Resolve discrepancies between perspectives

ENHANCED ANALYSIS METHODOLOGY:
- Systematic comparison of findings across image perspectives
- Advanced lighting compensation for accurate assessment
- Material consistency verification using multiple angles
- Comprehensive condition assessment with confidence scoring

REQUIRED JSON OUTPUT:
{
  "description": "Comprehensive ${componentName} analysis from multiple perspectives",
  "condition": {
    "summary": "Integrated assessment validated across viewing angles",
    "points": [
      {
        "observation": "Specific finding with location details",
        "severity": "CRITICAL|MAJOR|MODERATE|MINOR|TRACE", 
        "supportingImages": "Number of images confirming finding",
        "confidence": "HIGH|MEDIUM|LOW",
        "location": "Precise component area"
      }
    ],
    "rating": "EXCELLENT|GOOD|FAIR|POOR"
  },
  "crossValidation": {
    "materialConsistency": "CONFIRMED|MINOR_VARIATIONS|SIGNIFICANT_DISCREPANCIES",
    "conditionConsistency": "HIGHLY_CONSISTENT|MOSTLY_CONSISTENT|INCONSISTENT", 
    "lightingCompensation": true,
    "confidenceScore": 0.95
  },
  "perspectiveAnalysis": {
    "optimalAngles": ["Most informative viewing angles"],
    "additionalDocumentation": ["Areas requiring more images"],
    "imageQuality": "Overall assessment of image set"
  },
  "cleanliness": "Assessment validated across multiple perspectives",
  "recommendations": "Areas identified for special attention or additional documentation",
  "analysisMetadata": {
    "componentSpecificAnalysis": true,
    "customComponentName": "${componentName}",
    "enhancedClassification": true,
    "multiPerspectiveValidation": true
  }
}

Conduct your analysis with scientific rigor, using all available perspectives to ensure accuracy and applying component-specific expertise.`;
  }

  getSupportedModels(): ModelName[] {
    return ['gemini-2.0-flash-exp'];
  }

  getSupportedPromptTypes(): PromptType[] {
    return ['inventory', 'advanced', 'defect_analysis'];
  }
}
