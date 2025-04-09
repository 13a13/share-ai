
/**
 * Interface for Gemini API request
 */
export interface GeminiRequest {
  contents: {
    parts: {
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

/**
 * Creates a request body for the Gemini API with support for multiple images
 */
export function createGeminiRequest(promptText: string, imageData: string | string[]): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];

  // Create parts array with prompt text and all images
  const parts = [
    { text: promptText },
    ...imageDataArray.map(data => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: data
      }
    }))
  ];

  return {
    contents: [
      {
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 2048,  // Reduced output tokens
    }
  };
}

/**
 * Calls the Gemini API to analyze an image or multiple images
 */
export async function callGeminiApi(apiKey: string, request: GeminiRequest): Promise<any> {
  // Using gemini-1.5-flash model which replaced the deprecated gemini-pro-vision
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  
  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(`Failed to process image with Gemini: ${errorText}`);
  }

  const data = await response.json();
  
  // Extract the text content from Gemini response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textContent) {
    throw new Error("No content returned from Gemini API");
  }
  
  return textContent;
}
