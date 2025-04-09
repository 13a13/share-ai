
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
 * Optimized for large batches by limiting the number of images
 */
export function createGeminiRequest(promptText: string, imageData: string | string[]): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  
  // Limit to 10 images max for Gemini API (prevent overloading)
  // For large batches, we'll use a subset of the images (first, middle, and last few)
  let optimizedImageArray = imageDataArray;
  if (imageDataArray.length > 10) {
    // Take the first 4, middle 2, and last 4 images
    const first = imageDataArray.slice(0, 4);
    const middle = imageDataArray.length > 6 
      ? [imageDataArray[Math.floor(imageDataArray.length / 2) - 1], 
         imageDataArray[Math.floor(imageDataArray.length / 2)]]
      : [];
    const last = imageDataArray.slice(-4);
    
    optimizedImageArray = [...first, ...middle, ...last];
    
    // Update prompt to indicate we're analyzing a subset
    promptText = `${promptText}\n\nNote: You are being shown a representative subset of ${imageDataArray.length} total images. Please analyze what you see in these sample images.`;
  }

  // Create parts array with prompt text and selected images
  const parts = [
    { text: promptText },
    ...optimizedImageArray.map(data => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: data.startsWith('data:') ? data.split(',')[1] : data
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
      maxOutputTokens: 1024,  // Reduced output tokens for conciseness
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
