
import { createInventoryPrompt } from "./inventory-parser.ts";
import { createAdvancedMultiImagePrompt } from "./advanced-analysis.ts";
import { createDustAwarePrompt } from "./dust-detection.ts";

export type PromptType = 'inventory' | 'advanced' | 'dust';
export type ModelName = 'gemini-2.5-pro-preview-0506' | 'gemini-1.5-flash';

export class PromptManager {
  private modelPrompts: Record<ModelName, {
    inventory: (componentName: string) => string;
    advanced: (componentName: string, roomType: string, imageCount: number) => string;
    dust: (componentName: string, roomType: string) => string;
  }> = {
    'gemini-2.5-pro-preview-0506': {
      inventory: (componentName: string) => this.createProInventoryPrompt(componentName),
      advanced: (componentName: string, roomType: string, imageCount: number) => 
        this.createProAdvancedPrompt(componentName, roomType, imageCount),
      dust: (componentName: string, roomType: string) => 
        this.createProDustPrompt(componentName, roomType)
    },
    'gemini-1.5-flash': {
      inventory: (componentName: string) => createInventoryPrompt(componentName),
      advanced: (componentName: string, roomType: string, imageCount: number) => 
        createAdvancedMultiImagePrompt(componentName, roomType, imageCount),
      dust: (componentName: string, roomType: string) => 
        createDustAwarePrompt(componentName, roomType)
    }
  };

  getPrompt(
    modelName: ModelName, 
    promptType: PromptType,
    componentName: string,
    roomType?: string,
    imageCount?: number
  ): string {
    console.log(`📝 [PROMPT MANAGER] Getting ${promptType} prompt for ${modelName}`);
    
    const modelPrompts = this.modelPrompts[modelName] || this.modelPrompts['gemini-1.5-flash'];
    
    switch (promptType) {
      case 'inventory':
        return modelPrompts.inventory(componentName);
      case 'advanced':
        return modelPrompts.advanced(componentName, roomType || 'room', imageCount || 1);
      case 'dust':
        return modelPrompts.dust(componentName, roomType || 'room');
      default:
        console.warn(`⚠️ [PROMPT MANAGER] Unknown prompt type: ${promptType}, using inventory`);
        return modelPrompts.inventory(componentName);
    }
  }

  private createProInventoryPrompt(componentName: string): string {
    // Enhanced prompt specifically optimized for Gemini 2.5 Pro Preview 05-06
    return `You are an expert property inventory clerk with 15+ years of experience in professional property assessments.

COMPONENT ANALYSIS: ${componentName.toUpperCase()}

ENHANCED ANALYSIS PROTOCOL FOR GEMINI 2.5 PRO:

Your analysis must follow these EXACT professional standards:

1. MATERIAL IDENTIFICATION FRAMEWORK:
   - Primary material composition and quality grade
   - Secondary materials and finishing details
   - Construction method and installation quality indicators
   - Age estimation based on material characteristics

2. COMPREHENSIVE CONDITION ASSESSMENT:
   - Structural integrity: Load-bearing capacity, stability, mounting security
   - Surface condition: Wear patterns, damage types, staining, discoloration
   - Functional assessment: Operational status, alignment, mechanical function
   - Aesthetic impact: Visual presentation, finish quality, design coherence

3. PROFESSIONAL CLEANLINESS EVALUATION:
   - Surface contamination level and type identification
   - Accessibility for cleaning and maintenance requirements
   - Evidence of recent maintenance or neglect
   - Professional vs domestic cleaning standards assessment

4. ENHANCED SEVERITY CLASSIFICATION:
   Each observation must include precise severity grading:
   - LIGHT: Cosmetic issues, minimal impact on function/appearance
   - MINOR: Noticeable but acceptable, may require attention
   - MODERATE: Significant issues affecting function or presentation
   - HEAVY: Major problems requiring immediate attention or replacement

5. CONTEXTUAL FACTORS ANALYSIS:
   - Expected component lifespan and current lifecycle stage
   - Normal wear patterns vs actual damage differentiation
   - Maintenance requirements and cost implications
   - Replacement necessity and urgency assessment

GEMINI 2.5 PRO ENHANCED OUTPUT FORMAT:
{
  "description": "[Color] [Material] [Component type] with [Key distinguishing features]",
  "condition": {
    "summary": "[Comprehensive condition overview]",
    "points": [
      "[SEVERITY] [Specific observation with precise location and extent]",
      "[SEVERITY] [Additional observation with impact assessment]"
    ],
    "rating": "[EXCELLENT|GOOD|FAIR|POOR]"
  },
  "material_analysis": {
    "primary_material": "[Material type]",
    "quality_grade": "[HIGH|MEDIUM|LOW]",
    "estimated_age": "[Age range or condition indicator]"
  },
  "cleanliness": "[PROFESSIONAL_CLEAN|PROFESSIONAL_CLEAN_WITH_OMISSIONS|DOMESTIC_CLEAN_HIGH_LEVEL|DOMESTIC_CLEAN|NOT_CLEAN]",
  "maintenance_requirements": "[Specific maintenance needs]",
  "replacement_priority": "[LOW|MEDIUM|HIGH|URGENT]"
}

CRITICAL INSTRUCTIONS:
- Focus on factual, measurable observations only
- Avoid subjective interpretations or assumptions
- Use precise technical terminology
- Provide actionable insights for property management`;
  }

  private createProAdvancedPrompt(componentName: string, roomType: string, imageCount: number): string {
    return `ADVANCED MULTI-IMAGE ANALYSIS PROTOCOL - GEMINI 2.5 PRO PREVIEW 05-06

COMPONENT: ${componentName.toUpperCase()}
ROOM TYPE: ${roomType.toUpperCase()}
IMAGES: ${imageCount} perspectives for comprehensive analysis

You are conducting a sophisticated multi-perspective analysis using Gemini 2.5 Pro's advanced capabilities.

ENHANCED CROSS-VALIDATION REQUIREMENTS:
1. Material consistency verification across all viewing angles
2. Condition assessment triangulation using multiple perspectives
3. Advanced lighting compensation and shadow analysis
4. Angle-specific detail verification with confidence scoring
5. Temporal consistency checking for multi-shot sequences

SOPHISTICATED ANALYSIS METHODOLOGY:
- Compare and cross-reference findings across all image perspectives
- Identify and resolve discrepancies between different views
- Weight observations by image quality, lighting, and viewing angle
- Provide detailed confidence levels for each major assessment
- Generate consistency scores for material and condition findings

GEMINI 2.5 PRO MULTI-IMAGE OUTPUT:
{
  "description": "[Comprehensive component description synthesized from all perspectives]",
  "condition": {
    "summary": "[Integrated condition assessment from multiple angles]",
    "points": [
      {
        "observation": "[Detailed finding]",
        "severity": "[LIGHT|MINOR|MODERATE|HEAVY]",
        "supporting_images": "[Number of images confirming this finding]",
        "confidence": "[HIGH|MEDIUM|LOW]",
        "location": "[Specific component area]"
      }
    ],
    "rating": "[EXCELLENT|GOOD|FAIR|POOR]"
  },
  "cross_analysis": {
    "material_consistency": "[CONFIRMED|MINOR_VARIATIONS|SIGNIFICANT_DISCREPANCIES]",
    "condition_consistency": "[HIGHLY_CONSISTENT|MOSTLY_CONSISTENT|INCONSISTENT]",
    "lighting_compensation_applied": true,
    "view_discrepancies": "[Description of any differences noted between perspectives]",
    "confidence_score": "[0.0-1.0]"
  },
  "perspective_analysis": {
    "optimal_viewing_angles": "[List of most informative angles]",
    "areas_requiring_additional_documentation": "[Areas that need more images]",
    "image_quality_assessment": "[Overall quality score and notes]"
  },
  "cleanliness": "[Assessment with cross-verification from multiple angles]",
  "recommended_focus_areas": "[Areas identified as needing special attention]"
}

ADVANCED VALIDATION PROTOCOLS:
- Cross-reference all findings across minimum 3 image perspectives
- Flag any observations supported by fewer than 2 images as "requires verification"
- Weight final assessments based on image quality and viewing comprehensiveness
- Provide specific recommendations for additional documentation if needed`;
  }

  private createProDustPrompt(componentName: string, roomType: string): string {
    return `ENHANCED DUST AND CONTAMINATION ANALYSIS - GEMINI 2.5 PRO PREVIEW 05-06

COMPONENT: ${componentName.toUpperCase()} in ${roomType.toUpperCase()}

SOPHISTICATED CONTAMINATION ASSESSMENT PROTOCOL:

ADVANCED DUST ANALYSIS FRAMEWORK:
1. PARTICLE ACCUMULATION PATTERN MAPPING:
   - Surface distribution analysis (even/patchy/concentrated)
   - Thickness estimation using visual cues
   - Source identification (environmental/occupancy/construction)
   - Accumulation timeline assessment

2. CONTAMINATION TYPE DIFFERENTIATION:
   - Dust particles vs dirt vs debris vs staining
   - Organic vs inorganic matter identification
   - Recent accumulation vs established buildup
   - Maintenance-accessible vs embedded contamination

3. CLEANING COMPLEXITY ASSESSMENT:
   - Surface accessibility for routine cleaning
   - Required cleaning method intensity (simple/standard/deep)
   - Time and effort estimation for restoration
   - Professional vs domestic cleaning requirements

4. CONTEXT-SENSITIVE CLEANLINESS STANDARDS:
   - Room-specific contamination expectations
   - Component accessibility and usage frequency
   - Environmental factors (windows, ventilation, traffic)
   - Tenant occupancy patterns and standards

GEMINI 2.5 PRO FALSE POSITIVE PREVENTION:
- Natural material textures ≠ contamination (wood grain, stone patterns)
- Photographic artifacts ≠ surface conditions (compression, lighting)
- Shadow patterns ≠ dirt accumulation (lighting analysis)
- Wear patterns ≠ cleanliness issues (usage vs contamination)
- Reflective surfaces ≠ staining (glare and reflection analysis)

ENHANCED CONTAMINATION OUTPUT:
{
  "description": "[Component description focusing on surface condition]",
  "condition": {
    "summary": "[Overall condition with contamination impact]",
    "points": [
      {
        "finding": "[Specific contamination observation]",
        "severity": "[LIGHT|MODERATE|HEAVY]",
        "location": "[Precise location on component]",
        "type": "[DUST|DIRT|DEBRIS|STAINING|BUILDUP]"
      }
    ],
    "rating": "[Condition rating factoring contamination impact]"
  },
  "contamination_analysis": {
    "primary_type": "[DUST|DIRT|DEBRIS|STAINING|MIXED]",
    "distribution_pattern": "[EVEN|PATCHY|LOCALIZED|EDGE_ACCUMULATION|CORNER_BUILDUP]",
    "severity_level": "[LIGHT|MODERATE|HEAVY]",
    "estimated_age": "[RECENT|ESTABLISHED|LONG_TERM]",
    "cleaning_complexity": "[SIMPLE_WIPE|STANDARD_CLEANING|DEEP_CLEANING|PROFESSIONAL_REQUIRED]",
    "accessibility_rating": "[EASILY_ACCESSIBLE|REQUIRES_TOOLS|DIFFICULT_ACCESS]"
  },
  "environmental_factors": {
    "likely_sources": "[List of probable contamination sources]",
    "room_specific_considerations": "[Relevant room-type factors]",
    "prevention_recommendations": "[Maintenance suggestions]"
  },
  "cleanliness": "[Professional assessment based on property standards]",
  "cleaning_recommendations": {
    "immediate_action": "[What needs to be done now]",
    "maintenance_schedule": "[Recommended cleaning frequency]",
    "special_requirements": "[Any special cleaning needs]"
  }
}

CONTAMINATION VALIDATION CHECKLIST:
- Verify contamination is not natural material texture
- Confirm lighting conditions aren't creating false appearances
- Distinguish between wear patterns and actual contamination
- Assess whether contamination affects component function or presentation
- Provide specific, actionable cleaning recommendations`;
  }

  getSupportedModels(): ModelName[] {
    return Object.keys(this.modelPrompts) as ModelName[];
  }

  getSupportedPromptTypes(): PromptType[] {
    return ['inventory', 'advanced', 'dust'];
  }
}
