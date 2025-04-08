
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
    // Component-specific analysis
    const componentDescription = componentType.replace('_', ' ');
    return `This is an image of ${componentDescription} in a ${roomType || 'room'}. 
      Provide a detailed assessment of this specific component. 
      Describe its appearance, condition, any visible damage or wear, and cleanliness.
      Format your response as a JSON object with these fields:
      {
        "description": "detailed description of the component",
        "condition": "excellent|good|fair|poor|needs_replacement",
        "notes": "suggested notes about any issues that need attention"
      }`;
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
    // Look for JSON structure in the text
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
