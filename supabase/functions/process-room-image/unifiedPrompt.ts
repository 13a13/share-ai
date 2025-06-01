
interface PromptOptions {
  componentName: string;
  roomType: string;
  imageCount: number;
  analysisMode: 'standard' | 'inventory' | 'advanced';
  multipleImages?: boolean;
}

export function createUnifiedPrompt(options: PromptOptions): string {
  const { componentName, roomType, imageCount, analysisMode, multipleImages = false } = options;
  
  const basePrompt = `You are a professional property inspector analyzing ${componentName} in a ${roomType}. 
You are viewing ${imageCount} image${imageCount > 1 ? 's' : ''} of this component.

${getAnalysisModeInstructions(analysisMode, imageCount)}

RESPONSE FORMAT - Provide your response as a valid JSON object with this structure:
{
  "description": "Detailed description of the component's current state",
  "condition": {
    "summary": "Brief overall condition assessment",
    "points": [
      {
        "label": "Specific observation or defect",
        "validationStatus": "confirmed|unconfirmed",
        "supportingImageCount": number
      }
    ],
    "rating": "excellent|good|fair|poor"
  },
  "cleanliness": "professional_clean|professional_clean_with_omissions|domestic_clean_high_level|domestic_clean|not_clean",
  ${getEnhancedFields(analysisMode, imageCount)}
  "analysisMode": "${analysisMode}",
  "imageCount": ${imageCount},
  "processingNotes": ["Any relevant processing notes"]
}

${getRatingGuidelines()}
${getCleanlinessGuidelines()}

IMPORTANT: 
- Respond ONLY with valid JSON
- Keep descriptions concise (max 2 sentences)
- Focus on factual observations
- Rate condition conservatively
- For multiple images, cross-reference findings`;

  return basePrompt;
}

function getAnalysisModeInstructions(mode: string, imageCount: number): string {
  switch (mode) {
    case 'standard':
      return `STANDARD ANALYSIS: Provide a straightforward assessment of the component's condition, cleanliness, and any visible defects.`;
    
    case 'inventory':
      return `INVENTORY ANALYSIS: Conduct a detailed inventory-style inspection. Document all visible elements, materials, and conditions systematically.`;
    
    case 'advanced':
      return `ADVANCED MULTI-IMAGE ANALYSIS: 
- Cross-reference findings across all ${imageCount} images
- Validate defects and conditions from multiple angles
- Assess material consistency across different views
- Provide confidence levels for your observations
- Note any conflicting evidence between images`;
    
    default:
      return `STANDARD ANALYSIS: Provide a straightforward assessment of the component's condition, cleanliness, and any visible defects.`;
  }
}

function getEnhancedFields(mode: string, imageCount: number): string {
  if (mode === 'advanced' && imageCount > 1) {
    return `"materialConsistency": {
    "isConsistent": boolean,
    "variations": ["description of any material variations"],
    "confidence": "low|medium|high"
  },
  "defectAnalysis": {
    "defectsFound": [
      {
        "type": "defect type",
        "severity": "minor|moderate|major",
        "location": "specific location",
        "confidence": "low|medium|high"
      }
    ],
    "overallConfidence": "low|medium|high"
  },
  "crossImageValidation": {
    "consistentFindings": ["findings confirmed across multiple images"],
    "conflictingFindings": ["any conflicting observations"],
    "multiAngleValidation": [
      {
        "finding": "specific finding",
        "supportingImageCount": number
      }
    ]
  },`;
  }
  return '';
}

function getRatingGuidelines(): string {
  return `
CONDITION RATINGS:
- excellent: New or like-new condition, no defects
- good: Minor wear, fully functional, no significant defects
- fair: Moderate wear, some defects, may need attention
- poor: Significant defects, damage, or failure`;
}

function getCleanlinessGuidelines(): string {
  return `
CLEANLINESS LEVELS:
- professional_clean: Spotless, professional cleaning standard
- professional_clean_with_omissions: Mostly professional but some areas missed
- domestic_clean_high_level: Very clean, high domestic standard
- domestic_clean: Standard domestic cleaning level
- not_clean: Requires cleaning, visible dirt/debris`;
}
