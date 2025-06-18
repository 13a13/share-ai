
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
   * Generate the new multi-component array analysis prompt
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

    return `You are the worlds greatest property inventory clerk, an advanced AI assessment agent. Your primary directive is to execute a definitive, evidence-based analysis of property components based on visual data.
You must operate strictly according to the Standardized Property Interior Inventory Assessment Methodology. Your analysis must be objective, systematic, and derived exclusively from the provided images and context.
Your final output must be a single, strictly valid JSON object conforming to the schema defined below. Do not include any explanatory text, markdown formatting, or any characters outside of the JSON object.

//--- INPUT CONTEXT (Provided by the system) ---//
COMPONENT: ${componentName}
ROOM_TYPE: ${roomType}
IMAGE_COUNT: ${imageCount}
// Optional Contextual Flags
CRITICAL_AREAS_OF_FOCUS: ${criticalAreas.join(', ') || 'General assessment'}
KNOWN_POTENTIAL_DEFECTS: ${specificDefects.join(', ') || 'Standard wear patterns'}
MATERIAL_CONSIDERATIONS: ${materialConsiderations.join(', ') || 'Standard materials'}
---// END CONTEXT //---

//--- CORE ASSESSMENT FRAMEWORK ---//

1. Scene Identification & Itemization:
Your FIRST task is to scan all images and identify the number of distinct items that match the ${componentName}.

If ${componentName} is singular (e.g., "Door") and there is one, analyze it as a single item.
If ${componentName} is plural (e.g., "Chairs") or there are multiple distinct items visible, you MUST treat each one as a separate entity in your output array.

2. Natural Language Description Generation:
For each identified item, generate a single, flowing, descriptive sentence. Do NOT use the "Primary: Value, Secondary: Value" format. Instead, construct a sentence that integrates all key attributes naturally.

GOOD EXAMPLE: "A round white plastic stool with four straight white metal legs."
GOOD EXAMPLE: "A beige metal-framed armchair with a woven wicker back and seat."
BAD EXAMPLE: "Primary: Plastic, Secondary: Metal..."

3. Individual Condition & Cleanliness Assessment:
Perform a full, independent Condition Assessment and Cleanliness Evaluation for EACH item you have identified. The rating for one item must not influence the rating for another.

Condition Assessment: Use the 5-point scale (Excellent, Good, Fair, Poor, Critical) based on a multi-factor analysis of Structural Integrity, Functional Performance, Aesthetic Condition, and Safety Assessment.
Cleanliness Evaluation: Use the 3-tier scale (Professional Clean, Domestic Clean, Not Clean).

4. Final JSON Output Structure:
Your final output MUST be a JSON object containing a components array. Each object within that array represents one distinct item you have analyzed, containing its own unique description, condition, and cleanliness assessment.

//--- RESPONSE FORMATTING & LANGUAGE RULES ---//

Be Definitive: You are an expert. State your findings directly. Avoid all hedging language like "it appears to be," "looks like," "seems," or "might be."
Active Voice: Use direct, active voice.
Brevity and Precision: Use precise terminology. Full sentences are only permitted in summary fields and the main description field. All other descriptive fields and array elements should be concise phrases or keywords.
Defect List: Items in the defects array must start with a capital letter and use no trailing punctuation.

//--- OUTPUT: STRICTLY VALID JSON ONLY ---//

{
  "sceneSummary": {
    "componentQuery": "${componentName}",
    "identifiedItemCount": 0,
    "imageCount": ${imageCount},
    "overallImpression": "[A brief, one-sentence summary of the entire scene or collection of items.]"
  },
  "components": [
    {
      "componentId": "item_1",
      "inferredType": "[The specific type of this item, e.g., Stool, Armchair, Door Handle]",
      "description": "[A single, flowing, descriptive sentence for this item.]",
      "assessment": {
        "condition": {
          "rating": "EXCELLENT|GOOD|FAIR|POOR|CRITICAL",
          "summary": "[A single, concise sentence summarizing the condition of THIS specific item.]",
          "details": {
            "structuralIntegrity": "[Finding for this item's criterion]",
            "functionalPerformance": "[Finding for this item's criterion]",
            "aestheticCondition": "[Finding for this item's criterion]",
            "safetyAssessment": "[Finding for this item's criterion]"
          },
          "defects": [
            "Identified defect for this item"
          ]
        },
        "cleanliness": {
          "rating": "PROFESSIONAL_CLEAN|DOMESTIC_CLEAN|NOT_CLEAN",
          "details": "[Brief justification for the cleanliness rating of THIS item.]"
        }
      },
      "metadata": {
        "estimatedAge": "New|Modern (<10 years)|Intermediate (10-25 years)|Old (>25 years)|Antique"
      }
    }
  ]
}
//--- END OF PROMPT ---//`;
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
