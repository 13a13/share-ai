
/**
 * Simplified Gemini API - Exclusively uses Gemini 2.0 Flash
 * Updated to use the currently available model
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
 * Creates a request optimized specifically for Gemini 2.0 Flash
 */
export function createGeminiRequest(
  promptText: string, 
  imageData: string | string[]
): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  
  console.log(`📝 [GEMINI API] Creating Gemini 2.0 Flash request for ${imageDataArray.length} images`);
  
  // Gemini 2.0 Flash can handle up to 20 images efficiently
  const maxImages = 20;
  let optimizedImageArray = imageDataArray;
  
  if (imageDataArray.length > maxImages) {
    console.log(`📸 [GEMINI API] Optimizing ${imageDataArray.length} images for Gemini 2.0 Flash`);
    
    // Enhanced selection for comprehensive coverage
    const first = imageDataArray.slice(0, 6);
    const quarter = Math.floor(imageDataArray.length * 0.25);
    const middle1 = imageDataArray.slice(quarter, quarter + 4);
    const middle2 = imageDataArray.slice(Math.floor(imageDataArray.length * 0.5), Math.floor(imageDataArray.length * 0.5) + 4);
    const threeQuarter = Math.floor(imageDataArray.length * 0.75);
    const middle3 = imageDataArray.slice(threeQuarter, threeQuarter + 3);
    const last = imageDataArray.slice(-3);
    
    optimizedImageArray = [...first, ...middle1, ...middle2, ...middle3, ...last];
    
    // Update prompt with advanced context
    promptText = `${promptText}\n\n**GEMINI 2.0 FLASH CONTEXT:**\nYou are analyzing a strategically selected subset of ${imageDataArray.length} total images (${optimizedImageArray.length} selected), chosen for comprehensive coverage. Provide thorough analysis leveraging your advanced capabilities.`;
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

  // Optimized generation parameters for Gemini 2.0 Flash
  const generationConfig = {
    temperature: 0.2,  // Optimal for consistency and accuracy
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,  // Take advantage of Gemini 2.0 Flash's capabilities
  };

  console.log(`⚙️ [GEMINI API] Request configured for Gemini 2.0 Flash:`, {
    imageCount: optimizedImageArray.length,
    originalImageCount: imageDataArray.length,
    maxTokens: generationConfig.maxOutputTokens,
    temperature: generationConfig.temperature
  });

  return {
    contents: [{ parts }],
    generationConfig
  };
}

/**
 * Calls Gemini 2.0 Flash exclusively
 */
export async function callGeminiApi(
  apiKey: string, 
  request: GeminiRequest
): Promise<any> {
  const MODEL_NAME = 'gemini-2.0-flash-exp';
  
  console.log(`🚀 [GEMINI API] Calling Gemini 2.0 Flash exclusively`);
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [GEMINI API] Gemini 2.0 Flash error:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Gemini 2.0 Flash failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  // Enhanced response validation
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error(`No candidates returned from Gemini 2.0 Flash`);
  }
  
  const candidate = data.candidates[0];
  
  // Check for content filtering
  if (candidate.finishReason === 'SAFETY') {
    console.warn(`⚠️ [GEMINI API] Content filtered by safety settings`);
    throw new Error('Content was filtered due to safety policies');
  }
  
  if (!candidate.content?.parts?.[0]?.text) {
    console.error(`❌ [GEMINI API] Invalid response structure:`, candidate);
    throw new Error(`No text content returned from Gemini 2.0 Flash`);
  }
  
  const textContent = candidate.content.parts[0].text;
  console.log(`✅ [GEMINI API] Gemini 2.0 Flash returned ${textContent.length} characters`);
  
  return textContent;
}
