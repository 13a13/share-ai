
/**
 * Advanced Multi-Image Analysis Module
 * Implements enhanced prompts and response processing for cross-referential image analysis
 */

/**
 * Creates an advanced multi-image analysis prompt for the Gemini API
 * Uses spatially-aware, cross-referential validation techniques
 * 
 * @param componentName The specific component being analyzed
 * @param roomType The type of room containing the component
 * @param imageCount Number of images being analyzed
 */
export function createAdvancedMultiImagePrompt(
  componentName: string, 
  roomType: string, 
  imageCount: number
): string {
  // Base system context
  const systemContext = `## Multi-Image Component Analysis Protocol
**SYSTEM PROMPT FOR ${componentName.toUpperCase()} ANALYSIS**
**YOU ARE:** A forensic property inspector analyzing ALL ${imageCount} IMAGES COLLECTIVELY for **${componentName}** in a ${roomType || "room"}.

**CORE PRINCIPLE:**  
"Treat these images as parts of one puzzle - identify patterns across multiple views before making conclusions"`;

  // Component-specific analysis rules
  const analysisRules = getComponentSpecificRules(componentName, roomType);

  // Required analysis steps and validation processes
  const requiredSteps = `**REQUIRED ANALYSIS STEPS:**  
1. Cross-reference all images to establish spatial relationships  
2. Identify consistency in materials/colors across different angles  
3. Flag issues ONLY if visible in ≥2 images from different perspectives

**VALIDATION CHECKS:**  
${analysisRules.validationChecks}`;

  // Bias mitigation protocols
  const biasMitigation = `**BIAS MITIGATION:**  
- PRESUME NEUTRAL: "No observable defects" until proven  
- REJECT SINGLE-IMAGE EVIDENCE: "Insufficient visual confirmation"  
- LIGHTING FILTERS:  
  + Accept: Consistent discoloration across multiple lighting conditions
  - Reject: Shadow patterns or glare from single light source`;

  // Output requirements with structure and constraints
  const outputRequirements = `**OUTPUT REQUIREMENTS:**  
\`\`\`
{
  "component": "${componentName}",
  "crossAnalysis": {
    "materialConsistency": "bool",
    "defectConfidence": "low/medium/high",
    "multiAngleValidation": ["issue", "validatedCount"] 
  },
  "description": "Concise 15-word summary",
  "condition": {
    "summary": "Detailed assessment",
    "points": [
      {
        "label": "severity + issue",
        "validationStatus": "confirmed/unconfirmed",
        "supportingImageCount": integer
      }
    ],
    "rating": "excellent/good/fair/poor"
  },
  "cleanliness": "${getCleanlinessOptions()}",
  "notes": "Additional observations"
}
\`\`\``;

  // Prohibited assumptions to prevent false positives
  const prohibitedAssumptions = `**PROHIBITED ASSUMPTIONS:**  
🚫 Never infer:
- Dust/dirt (remove completely from assessment)
- Single-image shadows as defects
- Texture variations as wear without ${imageCount > 3 ? "3+" : "all available"} image confirmation

**COMPONENT-SPECIFIC DIRECTIVES:**
${analysisRules.componentDirectives}`;

  // Complete prompt assembly
  return `${systemContext}

${requiredSteps}

${biasMitigation}

${outputRequirements}

${prohibitedAssumptions}`;
}

/**
 * Returns component-specific validation rules
 */
function getComponentSpecificRules(componentName: string, roomType: string): { 
  validationChecks: string;
  componentDirectives: string; 
} {
  // Component taxonomy for specialized rules
  const componentType = categorizeComponent(componentName.toLowerCase());
  
  switch(componentType) {
    case "wall":
      return {
        validationChecks: `# Wall-specific validation
- Confirm texture consistency across ≥3 wall sections
- Check ceiling/wall junctions in multiple images
- Compare shadow patterns in different lighting conditions`,
        componentDirectives: `"When analyzing walls:
1. Map all images into virtual 3D space
2. Compare adjacent wall sections for continuity
3. Only report discoloration if appearing in:
   - Minimum 30% of surface area
   - Two different lighting conditions"`
      };
      
    case "floor":
      return {
        validationChecks: `# Floor-specific validation
- Verify consistent coloration across multiple floor areas
- Distinguish between shadows and actual staining
- Confirm scratches appear in multiple angles/lighting conditions`,
        componentDirectives: `"When analyzing floors:
1. Separate area into zones for comprehensive analysis
2. Identify pattern consistency across different sections
3. Only report wear patterns if visible from multiple angles
4. Check for moisture damage at transitions/edges"`
      };
      
    case "fixture":
      return {
        validationChecks: `# Fixture-specific validation
- Verify proper mounting from multiple angles
- Check functional elements in different states if visible
- Confirm alignment relative to surrounding components`,
        componentDirectives: `"When analyzing fixtures:
1. Assess functionality based on visible mechanical components
2. Confirm damage exists in structural (not cosmetic) elements
3. Evaluate installation quality against industry standards"`
      };
      
    default:
      return {
        validationChecks: `# General component rules
- Verify defects in both close-up and wide-angle shots
- Confirm alignment issues with reference lines in ≥2 images
- Check material consistency across varying lighting conditions`,
        componentDirectives: `"When analyzing ${componentName}:
1. Compare similar elements across multiple images
2. Verify that apparent damage is consistent across perspectives
3. Only report issues that are objectively present in multiple images"`
      };
  }
}

/**
 * Categorizes components into core types for specialized analysis
 */
function categorizeComponent(componentName: string): string {
  const wallTerms = ["wall", "ceiling", "paint", "wallpaper"];
  const floorTerms = ["floor", "carpet", "tile", "laminate", "wood", "vinyl"];
  const fixtureTerms = ["light", "switch", "outlet", "fitting", "tap", "faucet", "shower"];
  
  if (wallTerms.some(term => componentName.includes(term))) {
    return "wall";
  } else if (floorTerms.some(term => componentName.includes(term))) {
    return "floor";
  } else if (fixtureTerms.some(term => componentName.includes(term))) {
    return "fixture";
  }
  
  return "general";
}

/**
 * Provides standardized cleanliness options
 */
function getCleanlinessOptions(): string {
  return "PROFESSIONAL_CLEAN/PROFESSIONAL_CLEAN_WITH_OMISSIONS/DOMESTIC_CLEAN_TO_A_HIGH_LEVEL/DOMESTIC_CLEAN/NOT_CLEAN";
}

/**
 * Enhanced response parser for multi-image analysis output
 */
export function parseAdvancedAnalysisResponse(text: string): any {
  // First attempt to parse as JSON
  try {
    // Direct JSON parsing
    const parsedJson = JSON.parse(text);
    return validateAdvancedResponseSchema(parsedJson);
  } catch (e) {
    console.log("Failed direct JSON parsing, attempting to extract JSON from text");
    
    // Extract JSON if found within markdown or text blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```|(\{[\s\S]*\})/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2];
      try {
        const extractedJson = JSON.parse(jsonStr.trim());
        return validateAdvancedResponseSchema(extractedJson);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
      }
    }
    
    // If all JSON parsing fails, attempt structured text parsing
    return parseStructuredTextResponse(text);
  }
}

/**
 * Validates and normalizes the schema of the advanced analysis response
 */
function validateAdvancedResponseSchema(data: any): any {
  // Create a normalized schema
  const normalizedResponse = {
    component: data.component || "",
    description: data.description || "",
    crossAnalysis: {
      materialConsistency: typeof data.crossAnalysis?.materialConsistency === 'boolean' 
        ? data.crossAnalysis.materialConsistency 
        : null,
      defectConfidence: data.crossAnalysis?.defectConfidence || "low",
      multiAngleValidation: Array.isArray(data.crossAnalysis?.multiAngleValidation) 
        ? data.crossAnalysis.multiAngleValidation 
        : []
    },
    condition: {
      summary: data.condition?.summary || "",
      points: Array.isArray(data.condition?.points) 
        ? data.condition.points.map(point => {
            // Ensure each point has the required structure
            if (typeof point === 'string') {
              // Convert simple string points to structured format
              return {
                label: point,
                validationStatus: "unconfirmed",
                supportingImageCount: 1
              };
            }
            return {
              label: point.label || "",
              validationStatus: point.validationStatus || "unconfirmed",
              supportingImageCount: point.supportingImageCount || 1
            };
          })
        : [],
      rating: data.condition?.rating || "fair"
    },
    cleanliness: data.cleanliness || "domestic_clean",
    notes: data.notes || ""
  };
  
  return normalizedResponse;
}

/**
 * Parses text response when JSON parsing fails
 */
function parseStructuredTextResponse(text: string): any {
  // Attempt to extract structured sections from text
  const componentMatch = text.match(/Component:\s*([^\n]+)/i);
  const descriptionMatch = text.match(/Description:\s*([^\n]+)/i);
  const conditionMatch = text.match(/Condition:([\s\S]*?)(?=Cleanliness:|$)/i);
  const cleanlinessMatch = text.match(/Cleanliness:\s*([^\n]+)/i);
  const ratingMatch = text.match(/Rating:\s*([^\n]+)/i) || text.match(/Condition Rating:\s*([^\n]+)/i);
  const notesMatch = text.match(/Notes:\s*([\s\S]*?)(?=\n\w+:|$)/i);
  
  // Extract condition points
  const conditionPoints = [];
  if (conditionMatch && conditionMatch[1]) {
    const bulletPointMatches = conditionMatch[1].match(/[-•*]\s+([^\n]+)/g);
    if (bulletPointMatches) {
      bulletPointMatches.forEach(point => {
        const cleanedPoint = point.replace(/[-•*]\s+/, '').trim();
        if (cleanedPoint) {
          conditionPoints.push({
            label: cleanedPoint,
            validationStatus: cleanedPoint.toLowerCase().includes('confirm') ? "confirmed" : "unconfirmed",
            supportingImageCount: 1
          });
        }
      });
    }
  }
  
  // Map cleanliness value to standard
  let cleanlinessValue = cleanlinessMatch ? standardizeCleanlinessValue(cleanlinessMatch[1].trim()) : "domestic_clean";
  
  // Map rating to condition value
  let conditionRating = mapConditionRating(ratingMatch ? ratingMatch[1].trim() : "fair order");
  
  return {
    component: componentMatch ? componentMatch[1].trim() : "",
    description: descriptionMatch ? descriptionMatch[1].trim() : "",
    crossAnalysis: {
      materialConsistency: null,
      defectConfidence: "low",
      multiAngleValidation: []
    },
    condition: {
      summary: conditionPoints.map(p => p.label).join("\n"),
      points: conditionPoints,
      rating: conditionRating
    },
    cleanliness: cleanlinessValue,
    notes: notesMatch ? notesMatch[1].trim() : ""
  };
}

/**
 * Maps condition rating text to standardized values
 */
function mapConditionRating(rating: string): string {
  rating = rating.toLowerCase();
  if (rating.includes('good order') || rating.includes('excellent')) {
    return "excellent";
  } else if (rating.includes('used order') || rating.includes('good')) {
    return "good";
  } else if (rating.includes('fair order') || rating.includes('fair')) {
    return "fair";
  } else if (rating.includes('damaged') || rating.includes('poor')) {
    return "poor";
  }
  return "fair";
}

/**
 * Standardizes cleanliness values to system constants
 */
function standardizeCleanlinessValue(cleanliness: string): string {
  cleanliness = cleanliness.toLowerCase();
  
  if (cleanliness.includes('professional clean') && cleanliness.includes('omission')) {
    return "professional_clean_with_omissions";
  } else if (cleanliness.includes('professional clean')) {
    return "professional_clean";
  } else if (cleanliness.includes('high level')) {
    return "domestic_clean_to_a_high_level";
  } else if (cleanliness.includes('domestic clean')) {
    return "domestic_clean";
  } else if (cleanliness.includes('not clean')) {
    return "not_clean";
  }
  
  return "domestic_clean";
}

/**
 * Format the enhanced response for use in the UI
 */
export function formatAdvancedResponse(data: any, componentName: string = ""): any {
  // Ensure we have a component name
  const component = componentName || data.component || "Component";
  
  // Create a standardized response structure for the UI
  return {
    description: data.description || `${component} analysis`,
    crossAnalysis: data.crossAnalysis || {
      materialConsistency: null,
      defectConfidence: "low",
      multiAngleValidation: []
    },
    condition: {
      summary: data.condition?.summary || "",
      points: data.condition?.points || [],
      rating: data.condition?.rating || "fair"
    },
    cleanliness: data.cleanliness || "domestic_clean",
    notes: data.notes || "",
    analysisMode: "advanced"
  };
}

/**
 * Creates an optimized request configuration for multi-image analysis
 * with improved image selection for large batches
 */
export function createEnhancedGeminiRequest(
  promptText: string, 
  imageData: string[], 
  isAdvancedAnalysis: boolean = false
): any {
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  let optimizedImageArray = imageDataArray;
  
  // Enhanced image selection algorithm for advanced analysis
  if (isAdvancedAnalysis && imageDataArray.length > 10) {
    // Implement smart image selection based on image diversity
    const first = imageDataArray.slice(0, 3);
    const quarter = Math.floor(imageDataArray.length * 0.25);
    const middle1 = imageDataArray.slice(quarter, quarter + 2);
    const middle2 = imageDataArray.slice(Math.floor(imageDataArray.length * 0.5), Math.floor(imageDataArray.length * 0.5) + 2);
    const last = imageDataArray.slice(-3);
    
    optimizedImageArray = [...first, ...middle1, ...middle2, ...last];
    
    // Enhanced metadata for the prompt
    promptText = `${promptText}\n\n**ANALYSIS CONTEXT:**\nYou are being presented with a carefully selected subset of ${imageDataArray.length} total images, chosen to represent different perspectives and lighting conditions. Your analysis should synthesize observations across these representative images.`;
  } else if (imageDataArray.length > 10) {
    // Original algorithm for backward compatibility
    const first = imageDataArray.slice(0, 4);
    const middle = imageDataArray.length > 6 
      ? [imageDataArray[Math.floor(imageDataArray.length / 2) - 1], 
         imageDataArray[Math.floor(imageDataArray.length / 2)]]
      : [];
    const last = imageDataArray.slice(-4);
    
    optimizedImageArray = [...first, ...middle, ...last];
    promptText = `${promptText}\n\nNote: You are being shown a representative subset of ${imageDataArray.length} total images. Please analyze what you see in these sample images.`;
  }

  // Configure parts array with prompt and images
  const parts = [
    { text: promptText },
    ...optimizedImageArray.map(data => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: data.startsWith('data:') ? data.split(',')[1] : data
      }
    }))
  ];

  // Optimized model parameters for advanced analysis
  return {
    contents: [{ parts: parts }],
    generationConfig: {
      temperature: isAdvancedAnalysis ? 0.2 : 0.4, // Lower temperature for more consistent results in advanced mode
      topK: isAdvancedAnalysis ? 40 : 32,
      topP: isAdvancedAnalysis ? 0.95 : 1,
      maxOutputTokens: isAdvancedAnalysis ? 1536 : 1024, // More tokens for detailed analysis
    }
  };
}
