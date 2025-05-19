
/**
 * Advanced multi-image analysis module for property inspections
 * Implements cross-referential, spatially aware image analysis techniques
 */

/**
 * Creates an advanced multi-image analysis prompt for the Gemini API
 * Uses spatially-aware, cross-referential validation techniques
 * 
 * @param componentName The specific component being analyzed
 * @param roomType The type of room containing the component
 * @param imageCount Number of images being analyzed
 */
export function createAdvancedMultiImagePrompt(componentName: string, roomType: string, imageCount: number): string {
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
    "materialConsistency": true/false/null,
    "defectConfidence": "low/medium/high",
    "multiAngleValidation": [["issue1", 2], ["issue2", 3]]
  },
  "description": "Concise 15-word summary",
  "condition": {
    "summary": "Detailed assessment",
    "points": [
      {
        "label": "severity + issue",
        "validationStatus": "confirmed/unconfirmed",
        "supportingImageCount": 2
      }
    ],
    "rating": "excellent/good/fair/poor"
  },
  "cleanliness": "professional_clean/professional_clean_with_omissions/domestic_clean_high_level/domestic_clean/not_clean",
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
