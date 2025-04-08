
// Utility functions for the image processing API

// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Create prompt text based on the room type and component
 */
export function createPrompt(roomType?: string, componentType?: string, multipleImages: boolean = false): string {
  if (componentType) {
    // Component-specific analysis with optimized prompt structure
    const componentTitle = componentType.replace('_', ' ');
    
    if (multipleImages) {
      return `You are a professional property inspection assistant.

You are analysing **multiple photos** of the following room component: **${componentTitle}**.

From the set of images, provide the following:

1. A natural-language description of what is visible across all photos. Consider material, colour, build, and any visible features. Use all photos as context.
2. A detailed list of all objects visible in the images.
3. A detailed condition analysis. Identify any wear, damage, soiling, structural issues, or installation problems visible in any image.
4. Rate the condition using one of the following labels: Excellent, Good, Fair, Poor, Damaged.

Return the result in this exact format:

Description: [Paragraph summary across all images]

Objects: [List of all visible objects with their properties]

Condition:
- Summary: [Condition assessment using all images]
- Rating: [One of: Excellent, Good, Fair, Poor, Damaged]`;
    } else {
      return `You are a professional property inspection assistant.

You are analysing a photo of the following room component: ${componentTitle}.

From this image, provide the following:

1. A short, natural-language description of what is visible in the photo. Be specific about material, colour, and any visible characteristics.
2. A detailed list of all objects visible in the image with their properties.
3. A detailed condition analysis. Note any wear and tear, damage, age indicators, cleanliness, or specific issues.
4. Rate the condition using one of the following standard labels: Excellent, Good, Fair, Poor, Damaged.

Return the result in this exact format:

Description: [One-paragraph natural description]

Objects: [List of all visible objects with their properties]

Condition:
- Summary: [Detailed assessment]
- Rating: [One of: Excellent, Good, Fair, Poor, Damaged]`;
    }
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
      const descriptionMatch = textContent.match(/Description:\s*(.*?)(?=\s*Objects:|$)/s);
      const objectsMatch = textContent.match(/Objects:\s*(.*?)(?=\s*Condition:|$)/s);
      
      // Extract condition data with the new format
      const conditionBlock = textContent.match(/Condition:\s*(.*?)(?=\s*$)/s);
      let conditionSummary = "";
      let conditionRating = "fair";
      
      if (conditionBlock && conditionBlock[1]) {
        // Extract the summary and rating from the condition block
        const summaryMatch = conditionBlock[1].match(/- Summary:\s*(.*?)(?=\s*-|$)/s);
        const ratingMatch = conditionBlock[1].match(/- Rating:\s*(.*?)(?=\s*$)/s);
        
        if (summaryMatch && summaryMatch[1]) {
          conditionSummary = summaryMatch[1].trim();
        }
        
        if (ratingMatch && ratingMatch[1]) {
          conditionRating = mapCondition(ratingMatch[1].trim());
        }
      }
      
      return {
        description: descriptionMatch ? descriptionMatch[1].trim() : "No description available",
        objects: objectsMatch ? objectsMatch[1].trim().split('\n').map(item => item.trim()).filter(Boolean) : [],
        condition: {
          summary: conditionSummary,
          rating: conditionRating
        }
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
      objects: parsedData.objects || [],
      condition: {
        summary: parsedData.condition?.summary || "",
        rating: parsedData.condition?.rating || "fair"
      },
      notes: parsedData.objects ? `Objects detected: ${parsedData.objects.join(', ')}` : ""
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
      objects: [],
      condition: {
        summary: "AI analysis failed, please add manual description",
        rating: "fair"
      }
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
