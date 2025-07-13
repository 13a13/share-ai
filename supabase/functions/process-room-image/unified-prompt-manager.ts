
/**
 * Unified Prompt Manager - Multi-Component Array Analysis System
 */

export interface ComponentAnalysisContext {
  componentName: string;
  roomType: string;
  imageCount: number;
  criticalAreas?: string[];
  specificDefects?: string[];
  materialConsiderations?: string[];
}

export class UnifiedPromptManager {
  /**
   * Generate the enhanced multi-component array analysis prompt
   */
  generateUnifiedPrompt(context: ComponentAnalysisContext): string {
    const {
      componentName,
      roomType,
      imageCount,
      criticalAreas = [],
      specificDefects = [],
      materialConsiderations = []
    } = context;

    return `You are an expert property assessment AI. Your task is to perform standardized condition evaluations and deliver concise, location-specific, actionable reports. You must adhere to the strict formatting and content mandates below without deviation.

**CORE OBJECTIVE**: Produce precisely formatted, location-aware condition descriptions using the mandatory severity scales, component identification protocols, and JSON structure.

//--- INPUT CONTEXT ---//
COMPONENT_QUERY: ${componentName}
ROOM_TYPE: ${roomType}
IMAGE_COUNT: ${imageCount}
FOCUS_AREAS: ${criticalAreas.join(', ') || 'General assessment'}
POTENTIAL_ISSUES: ${specificDefects.join(', ') || 'Standard wear patterns'}
MATERIALS: ${materialConsiderations.join(', ') || 'Standard materials'}

//--- ASSESSMENT FRAMEWORK ---//

**1. COMPONENT IDENTIFICATION MANDATE (CRITICAL RULE)**
- The 'inferredType' field MUST follow the exact structure: "[Colour] [Material] [Component]".
- This is not a suggestion. It is a mandatory format.
- **Correct Examples**: "White Laminate Door", "Brushed Steel Handle", "Oak Wood Flooring", "Grey Fabric Armchair".
- **Incorrect Examples**: "Door", "A table made of wood", "The component is a chair".

**2. MANDATORY SEVERITY SCALE:**
- **MINOR**: Superficial, easily remedied cosmetic issues (e.g., light scuffs, dust).
- **MODERATE**: Visible defects needing repair or deeper cleaning, impacting aesthetics.
- **HEAVY**: Major damage requiring replacement, professional restoration, or expert intervention.

**3. SPATIAL AWARENESS REQUIREMENTS:**
For the ${imageCount} provided images, you are required to:
1. Synthesize all views to determine spatial orientation (front, back, left/right side, top/bottom).
2. Use specific location descriptors: left/right side, front/back panel, top/bottom surface, upper/lower corner, center, edge.
3. Anchor every single defect to its precise location on the component.

**4. DEFECT GROUPING & SUMMARY MANDATES:**
1. Combine all related defects for a single component into one fluid summary sentence.
2. Use natural connectors: "and", "with", "along with".
3. **CRITICAL**: Do NOT start the condition summary by naming the component (e.g., "The door has..."). The JSON key already establishes the context. The summary must begin directly with the condition description.
    - **Correct**: "Minor scuffing on the lower left corner with moderate staining across the center."
    - **Incorrect**: "The table has minor scuffing..."

//--- STRICT JSON RESPONSE FORMAT ---//
{
  "sceneSummary": {
    "componentQuery": "${componentName}",
    "identifiedItemCount": [integer: number of distinct items],
    "imageCount": ${imageCount},
    "spatialAnalysis": "[Brief summary of angles and views captured across images]",
    "overallImpression": "[One-sentence scene overview]"
  },
  "components": [
    {
      "componentId": "item_1",
      "inferredType": "[MANDATORY FORMAT: [Colour] [Material] [Component], e.g., White Laminate Door]",
      "description": "[Other physical traits ONLY: e.g., Medium size, flat panel design, chrome handle. DO NOT include colour, material, or component type here.]",
      "assessment": {
        "condition": {
          "rating": "EXCELLENT|GOOD|FAIR|POOR|CRITICAL",
          "summary": "[One flowing sentence grouping all defects. MUST NOT start with the component name.]",
          "locationSpecificFindings": [
            "[Severity] [defect] on [specific location]",
            "[Severity] [defect] on [another specific location]"
          ]
        },
        "cleanliness": {
          "rating": "PROFESSIONAL_CLEAN|DOMESTIC_CLEAN|NOT_CLEAN",
          "details": "[Brief cleanliness note]"
        }
      },
      "spatialContext": {
        "viewAngles": "[Describe how the item appears across images, e.g., Front and side views captured]",
        "locationInRoom": "[Position within room if discernible, e.g., Left of window]"
      }
    }
  ]
}

**MANDATORY EXAMPLES (BY RATING):**

- **EXCELLENT**: "Pristine condition with no defects observed on any surface."
- **GOOD**: "Minor surface scratches on the front right edge and light dust accumulation on the top."
- **FAIR**: "Moderate staining across the center surface with minor chipping along the bottom left corner."
- **POOR**: "Heavy cracking on the right side and moderate discoloration throughout the main panel."
- **CRITICAL**: "Heavy structural damage to the base, posing an immediate safety hazard."

**FINAL CHECKLIST & ESSENTIAL RULES:**
1. **The \`inferredType\` MUST be in the "[Colour] [Material] [Component]" format.**
2. **The \`assessment.summary\` must NOT mention the component's name.**
3. Every defect must be assigned a severity (Minor/Moderate/Heavy) and a specific location.
4. All defects for one component are consolidated into a single summary sentence.
5. The \`description\` field must NOT contain information already in \`inferredType\`.
6. Output must be valid JSON only, with no explanatory text outside the JSON structure.`;
  }

  /**
   * Get component-specific context for enhanced analysis
   */
  getComponentContext(componentName: string): {
    criticalAreas: string[];
    specificDefects: string[];
    materialConsiderations: string[];
  } {
    const componentLower = componentName.toLowerCase();
    
    // Wall-related components
    if (componentLower.includes('wall') || componentLower.includes('paint')) {
      return {
        criticalAreas: ['Surface texture', 'Color uniformity', 'Joint alignment', 'Edge integrity'],
        specificDefects: ['Cracks', 'Scuff marks', 'Nail holes', 'Paint chips', 'Staining', 'Fading'],
        materialConsiderations: ['Paint quality', 'Surface preparation', 'Texture type', 'Primer visibility']
      };
    }
    
    // Floor-related components
    if (componentLower.includes('floor') || componentLower.includes('carpet') || componentLower.includes('tile')) {
      return {
        criticalAreas: ['Surface wear patterns', 'Edge conditions', 'Transition areas', 'Moisture damage'],
        specificDefects: ['Scratches', 'Dents', 'Loose tiles', 'Carpet pulls', 'Staining', 'Buckling'],
        materialConsiderations: ['Material type', 'Installation quality', 'Subfloor condition', 'Wear resistance']
      };
    }
    
    // Fixture-related components
    if (componentLower.includes('light') || componentLower.includes('switch') || componentLower.includes('outlet')) {
      return {
        criticalAreas: ['Mounting security', 'Electrical connections', 'Housing integrity', 'Operational status'],
        specificDefects: ['Loose mounting', 'Cracked housing', 'Discoloration', 'Missing parts', 'Corrosion'],
        materialConsiderations: ['Plastic quality', 'Metal finish', 'Electrical safety', 'Code compliance']
      };
    }
    
    // Default for general components
    return {
      criticalAreas: ['Overall condition', 'Functional integrity', 'Aesthetic appearance', 'Installation quality'],
      specificDefects: ['Wear patterns', 'Material fatigue', 'Color changes', 'Surface damage', 'Alignment issues'],
      materialConsiderations: ['Material quality', 'Age indicators', 'Maintenance history', 'Environmental exposure']
    };
  }
}
