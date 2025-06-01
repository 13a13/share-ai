// Define CORS headers for the function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a prompt for room/component analysis
 * @deprecated Use createUnifiedPrompt from unifiedPrompt.ts instead
 */
export function createPrompt(roomType?: string, componentName?: string, multipleImages: boolean = false): string {
  console.log('Warning: createPrompt is deprecated. Use createUnifiedPrompt instead.');
  
  const component = componentName || 'component';
  const room = roomType || 'room';
  
  return `You are a professional property inspector analyzing a ${component} in a ${room}.
${multipleImages ? 'You are viewing multiple images of this component.' : 'You are viewing an image of this component.'}

Provide a JSON response with:
{
  "description": "Brief description (max 2 sentences)",
  "condition": {
    "summary": "Overall condition",
    "points": ["specific observations"],
    "rating": "excellent|good|fair|poor"
  },
  "cleanliness": "professional_clean|domestic_clean|not_clean",
  "analysisMode": "standard",
  "imageCount": 1
}

Keep responses concise and factual.`;
}

/**
 * Extracts JSON content from text response
 */
export function extractJsonFromText(text: string): any {
  try {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, create a basic structure
    return {
      description: text.substring(0, 200),
      condition: {
        summary: "Manual review required",
        points: ["AI analysis incomplete"],
        rating: "fair"
      },
      cleanliness: "domestic_clean"
    };
  } catch (error) {
    console.error('Error extracting JSON:', error);
    return null;
  }
}

/**
 * Formats the response for frontend consumption
 * @deprecated Use parseUnifiedResponse instead
 */
export function formatResponse(data: any, componentName?: string): any {
  console.log('Warning: formatResponse is deprecated. Use parseUnifiedResponse instead.');
  
  if (!data) {
    return createFallbackResponse(componentName);
  }
  
  return {
    description: data.description || `Analysis of ${componentName || 'component'}`,
    condition: {
      summary: data.condition?.summary || data.summary || 'No summary available',
      points: Array.isArray(data.condition?.points) ? data.condition.points : (data.points || []),
      rating: data.condition?.rating || data.rating || 'fair'
    },
    cleanliness: data.cleanliness || 'domestic_clean',
    notes: data.notes,
    analysisMode: data.analysisMode || 'standard'
  };
}

/**
 * Creates a fallback response when AI processing fails
 */
export function createFallbackResponse(componentName?: string): any {
  return {
    description: `Analysis of ${componentName || 'component'} - AI processing failed`,
    condition: {
      summary: "Manual review required",
      points: ["AI analysis failed - please add description manually"],
      rating: "fair"
    },
    cleanliness: "domestic_clean",
    notes: "AI analysis failed - please add description manually",
    analysisMode: "standard",
    imageCount: 1,
    processingNotes: ["AI processing failed", "Fallback response generated"]
  };
}
