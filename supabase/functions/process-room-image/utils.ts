
// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a prompt for the Gemini API based on room type and component
 * @param roomType The type of room being processed (e.g., "bathroom", "kitchen")
 * @param componentType The specific component type (e.g., "walls", "floors")
 * @param multipleImages Whether there are multiple images to process
 * @param maxSentences Maximum number of sentences for each response field (default: 2)
 * @returns A prompt string
 */
export function createPrompt(roomType: string, componentType?: string, multipleImages = false, maxSentences = 2): string {
  const basePrompt = `
  You are a professional property inspector who analyzes images of property interiors.
  ${multipleImages ? "I'm providing multiple images of the same area from different angles." : ""}
  ${maxSentences ? `IMPORTANT: Limit your responses to a maximum of ${maxSentences} sentences per field.` : ""}
  
  Please analyze what you see in ${multipleImages ? "these images" : "this image"} and provide a concise, professional assessment.
  `;
  
  if (componentType) {
    return `
      ${basePrompt}
      
      This is an image of ${componentType} in a ${roomType || 'room'}. 
      
      Give me the following details, strictly in the format of a JSON object:
      {
        "description": "Brief factual description of what you see, focusing on the ${componentType}. Maximum ${maxSentences} sentences.",
        "condition": {
          "summary": "Brief assessment of the condition. Maximum ${maxSentences} sentences.",
          "rating": "One of the following: excellent, good, fair, poor, very_poor"
        },
        "notes": "Any important notes or recommendations regarding this component. Maximum ${maxSentences} sentences."
      }
      
      Keep it brief, factual, and focus only on what is visible.
    `;
  } else {
    // Full room analysis
    return `
      ${basePrompt}
      
      This is an image of a ${roomType || 'room'} in a property.
      
      Give me the following details, strictly in the format of a JSON object:
      {
        "roomAssessment": {
          "generalCondition": "Brief overall condition assessment. Maximum ${maxSentences} sentences.",
          "walls": "Brief assessment of the walls. Maximum ${maxSentences} sentences.",
          "ceiling": "Brief assessment of the ceiling. Maximum ${maxSentences} sentences.",
          "flooring": "Brief assessment of the flooring/floor. Maximum ${maxSentences} sentences.",
          "doors": "Brief assessment of any doors. Maximum ${maxSentences} sentences.",
          "windows": "Brief assessment of any windows. Maximum ${maxSentences} sentences.",
          "lighting": "Brief assessment of lighting fixtures. Maximum ${maxSentences} sentences.",
          ${roomType === 'kitchen' ? `"appliances": "Brief assessment of kitchen appliances. Maximum ${maxSentences} sentences.",` : ''}
          ${roomType === 'bathroom' ? `"plumbing": "Brief assessment of bathroom fixtures. Maximum ${maxSentences} sentences.",` : ''}
          "cleaning": "Brief assessment of cleanliness. Maximum ${maxSentences} sentences."
        }
      }
      
      Focus on observable condition, damage, or wear. If an element is not visible, state "Not visible in image."
      Keep responses concise and professional.
    `;
  }
}

/**
 * Extracts JSON data from Gemini's text output
 * @param text Text output from Gemini API
 * @returns Parsed JSON object
 */
export function extractJsonFromText(text: string): any {
  try {
    // Find JSON pattern in text (anything within curly braces, including nested curly braces)
    const jsonMatch = text.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
    
    if (jsonMatch && jsonMatch[0]) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Try to find content without code block markers
    const codeBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1]);
    }
    
    // Last resort, try to parse the whole text
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing JSON from Gemini response:", error);
    console.error("Raw text:", text);
    
    // If parsing fails, create a fallback response
    return {
      description: "Unable to analyze image properly.",
      condition: { 
        summary: "Analysis unavailable.",
        rating: "fair"
      },
      notes: "Please try again with a clearer image.",
      roomAssessment: {
        generalCondition: "Unable to analyze image properly.",
        walls: "Analysis unavailable.",
        ceiling: "Analysis unavailable.",
        flooring: "Analysis unavailable.",
        doors: "Analysis unavailable.",
        windows: "Analysis unavailable.",
        lighting: "Analysis unavailable.",
        cleaning: "Analysis unavailable."
      }
    };
  }
}

/**
 * Formats the API response based on whether this is a component or full room
 * @param data Parsed data from Gemini
 * @param componentType The component type (if any)
 * @returns Formatted response object
 */
export function formatResponse(data: any, componentType?: string): any {
  if (componentType) {
    // Component analysis - take what we have, ensure it has the right structure
    return {
      description: data.description || "No description available.",
      condition: {
        summary: data.condition?.summary || "Condition unknown.",
        rating: data.condition?.rating || "fair"
      },
      notes: data.notes || ""
    };
  } else {
    // Full room analysis
    return data;
  }
}

/**
 * Creates a fallback response when the API fails
 * @param componentType The component type (if any)
 * @returns Fallback response object
 */
export function createFallbackResponse(componentType?: string): any {
  if (componentType) {
    return {
      description: "Unable to analyze component accurately.",
      condition: {
        summary: "Please manually assess the condition.",
        rating: "fair"
      },
      notes: "Consider retaking the image with better lighting."
    };
  } else {
    return {
      roomAssessment: {
        generalCondition: "Unable to analyze room accurately.",
        walls: "Please manually assess the condition.",
        ceiling: "Please manually assess the condition.",
        flooring: "Please manually assess the condition.",
        doors: "Please manually assess the condition.",
        windows: "Please manually assess the condition.",
        lighting: "Please manually assess the condition.",
        cleaning: "Please manually assess the condition."
      }
    };
  }
}
