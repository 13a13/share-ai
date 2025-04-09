// Define CORS headers for the function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a prompt for Gemini model based on room and component type
export const createPrompt = (roomType: string, componentName: string, multipleImages = false) => {
  const promptBase = `You are an AI assistant analyzing ${
    multipleImages ? "multiple images" : "an image"
  } of ${
    componentName ? `a ${componentName} in` : ""
  } a ${roomType || "room"}. 
  
  Provide a JSON object with the following information:
  1. A brief description of what you see
  2. An assessment of the condition (excellent, good, fair, poor)
  3. Any notable features or concerns
  
  Keep your responses concise - no more than 2-3 sentences per section.`;

  return promptBase;
};

// Extract JSON from text response
export const extractJsonFromText = (text: string): any => {
  try {
    // Try to parse the whole text as JSON first
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to find JSON inside the text
    const jsonMatch = text.match(/```json([\s\S]*?)```|```([\s\S]*?)```|(\{[\s\S]*\})/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
      try {
        return JSON.parse(jsonStr.trim());
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
      }
    }
    
    // As a final fallback, try to extract just the outermost curly braces content
    const fallbackMatch = text.match(/\{[\s\S]*\}/);
    if (fallbackMatch) {
      try {
        return JSON.parse(fallbackMatch[0]);
      } catch (e3) {
        console.error("Failed to parse fallback JSON:", e3);
      }
    }
  }
  
  // If all parsing attempts fail, return a minimal object
  return {
    description: "Failed to parse AI response",
    condition: "fair",
    notes: "The AI generated an unparseable response. Please try again or inspect manually."
  };
};

// Format the response to maintain consistent structure
export const formatResponse = (data: any, componentName: string | undefined) => {
  // If this is a component response, format for component
  if (componentName) {
    return {
      description: data.description || "",
      condition: {
        summary: data.notes || data.concerns || "",
        points: Array.isArray(data.points) ? data.points : [],
        rating: data.condition || "fair"
      },
      cleanliness: data.cleanliness || "domestic_clean",
      notes: data.notes || ""
    };
  }
  
  // Otherwise return the full room assessment format
  return data;
};

// Create a fallback response if processing fails
export const createFallbackResponse = (componentName: string | undefined) => {
  if (componentName) {
    return {
      description: `${componentName || "Component"} - AI analysis unavailable`,
      condition: {
        summary: "Could not analyze the image(s) automatically",
        points: ["Manual inspection required"],
        rating: "fair"
      },
      cleanliness: "domestic_clean",
      notes: "AI analysis failed - please add description manually"
    };
  }
  
  return {
    roomAssessment: {
      generalCondition: "fair",
      notes: "AI analysis failed - please evaluate manually"
    }
  };
};
