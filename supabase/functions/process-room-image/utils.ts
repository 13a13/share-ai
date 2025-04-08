
// Utility functions for the image processing API

// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Create prompt text based on the room type and component
 */
export function createPrompt(roomType?: string, componentType?: string): string {
  if (componentType) {
    // Component-specific analysis with optimized prompt structure
    const componentTitle = componentType.replace('_', ' ');
    
    return `You are a professional property inspection assistant.

You are analysing a photo of the following component: ${componentTitle}.

Based only on this photo, answer the following:

1. What is the item? Briefly describe what is visible in natural language.
2. What is its condition? Use one of the following labels: Excellent, Good, Fair, Poor, Damaged.
3. Return the result in this exact format:

Description: [Your one-paragraph summary here]  
Condition: [Label]`;
  } else {
    // Full room analysis (original behavior)
    const roomTypeDescription = roomType 
      ? `This is a ${roomType.replace('_', ' ')}. `
      : "This is a room. ";

    return `${roomTypeDescription}Analyze this room image and provide a detailed assessment. 
      Identify objects, their condition and description. Also provide an overall room assessment including
      general condition, walls, ceiling, flooring, doors, windows, lighting, furniture (if visible), 
      appliances (if visible), and cleaning needs. Format your response as structured data that I can parse as JSON.`;
  }
}

/**
 * Extract JSON data from Gemini's text response
 */
export function extractJsonFromText(textContent: string): any {
  try {
    // For component analysis with the new format, parse the text response into a structured format
    if (textContent.includes("Description:") && textContent.includes("Condition:")) {
      const descriptionMatch = textContent.match(/Description:\s*(.*?)(?=\s*Condition:|$)/s);
      const conditionMatch = textContent.match(/Condition:\s*(.*?)(?=\s*$)/s);
      
      return {
        description: descriptionMatch ? descriptionMatch[1].trim() : "No description available",
        condition: conditionMatch ? mapCondition(conditionMatch[1].trim()) : "fair",
        notes: ""
      };
    }
    
    // For full room analysis or fallback, use the original JSON parsing logic
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                  textContent.match(/{[\s\S]*}/);
    
    let jsonContent;
    if (jsonMatch) {
      jsonContent = jsonMatch[0].replace(/```json\n|```/g, '');
    } else {
      jsonContent = textContent;
    }
    
    // Parse the JSON content
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error("Error parsing text as JSON:", error);
    throw error;
  }
}

/**
 * Map Gemini's condition labels to system condition values
 */
function mapCondition(condition: string): string {
  const conditionLower = condition.toLowerCase().trim();
  
  if (conditionLower.includes("excellent")) return "excellent";
  if (conditionLower.includes("good")) return "good";
  if (conditionLower.includes("fair")) return "fair";
  if (conditionLower.includes("poor")) return "poor";
  if (conditionLower.includes("damaged")) return "needs_replacement";
  
  // Default to fair if no match
  return "fair";
}

/**
 * Format the response based on whether this is a component or full room
 */
export function formatResponse(parsedData: any, componentType?: string): any {
  if (componentType) {
    // For component analysis
    return {
      description: parsedData.description || "No description available",
      condition: parsedData.condition || "fair",
      notes: parsedData.notes || "",
    };
  } else {
    // For full room analysis (original behavior)
    return {
      objects: parsedData.objects || [],
      roomAssessment: parsedData.roomAssessment || {
        generalCondition: "Unknown",
        walls: "Unknown",
        ceiling: "Unknown",
        flooring: "Unknown",
        doors: "Unknown",
        windows: "Unknown",
        lighting: "Unknown",
        cleaning: "Needs regular cleaning"
      }
    };
  }
}

/**
 * Create a fallback response when AI analysis fails
 */
export function createFallbackResponse(componentType?: string): any {
  if (componentType) {
    return {
      description: "Could not determine from image",
      condition: "fair",
      notes: "AI analysis failed, please add manual description"
    };
  } else {
    return {
      objects: [{ name: "Unknown", condition: "Unknown", description: "Could not identify objects" }],
      roomAssessment: {
        generalCondition: "Could not determine from image",
        walls: "Unknown",
        ceiling: "Unknown",
        flooring: "Unknown",
        doors: "Unknown",
        windows: "Unknown",
        lighting: "Unknown",
        cleaning: "Unknown"
      }
    };
  }
}
