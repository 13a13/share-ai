
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
export function createGeminiRequest(
  promptText: string, 
  imageData: string | string[], 
  isAdvancedAnalysis: boolean = false
): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  
  // Limit to 10 images max for Gemini API (prevent overloading)
  // For large batches, implement optimized selection algorithm
  let optimizedImageArray = imageDataArray;
  
  if (imageDataArray.length > 10) {
    if (isAdvancedAnalysis) {
      // Enhanced image selection for advanced analysis
      const first = imageDataArray.slice(0, 3);
      const quarter = Math.floor(imageDataArray.length * 0.25);
      const middle1 = imageDataArray.slice(quarter, quarter + 2);
      const middle2 = imageDataArray.slice(Math.floor(imageDataArray.length * 0.5), Math.floor(imageDataArray.length * 0.5) + 2);
      const last = imageDataArray.slice(-3);
      
      optimizedImageArray = [...first, ...middle1, ...middle2, ...last];
      
      // Update prompt with context about subset selection
      promptText = `${promptText}\n\n**ANALYSIS CONTEXT:**\nYou are analyzing a carefully selected subset of ${imageDataArray.length} total images, chosen to represent different perspectives and lighting conditions.`;
    } else {
      // Original selection algorithm
      const first = imageDataArray.slice(0, 4);
      const middle = imageDataArray.length > 6 
        ? [imageDataArray[Math.floor(imageDataArray.length / 2) - 1], 
          imageDataArray[Math.floor(imageDataArray.length / 2)]]
        : [];
      const last = imageDataArray.slice(-4);
      
      optimizedImageArray = [...first, ...middle, ...last];
      
      // Standard subset note
      promptText = `${promptText}\n\nNote: You are being shown a representative subset of ${imageDataArray.length} total images. Please analyze what you see in these sample images.`;
    }
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

  // Configure generation parameters based on analysis mode
  return {
    contents: [
      {
        parts: parts
      }
    ],
    generationConfig: {
      temperature: isAdvancedAnalysis ? 0.2 : 0.4,  // Lower temperature for consistency in advanced mode
      topK: isAdvancedAnalysis ? 40 : 32,
      topP: isAdvancedAnalysis ? 0.95 : 1.0,
      maxOutputTokens: isAdvancedAnalysis ? 1536 : 1024,  // Increased tokens for detailed analysis
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
