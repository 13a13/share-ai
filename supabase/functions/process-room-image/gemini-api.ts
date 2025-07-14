
/**
 * Standardized Gemini 2.0 Flash API - Single Source of Truth
 * Uses only gemini-2.0-flash (aliased as gemini-2.0-flash-exp)
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
 * Creates a request optimized for Gemini 2.0 Flash
 * Note: gemini-2.0-flash is aliased as gemini-2.0-flash-exp in the API
 */
export function createGeminiRequest(
  promptText: string, 
  imageData: string | string[]
): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  
  console.log(`📝 [GEMINI API] Creating Gemini 2.0 Flash request for ${imageDataArray.length} images`);
  
  // Gemini 2.0 Flash supports up to 20 images
  const maxImages = 20;
  let optimizedImageArray = imageDataArray;
  
  if (imageDataArray.length > maxImages) {
    console.log(`📸 [GEMINI API] Optimizing ${imageDataArray.length} images for Gemini 2.0 Flash (max: ${maxImages})`);
    
    // Smart selection for comprehensive coverage
    const first = imageDataArray.slice(0, 6);
    const quarter = Math.floor(imageDataArray.length * 0.25);
    const middle1 = imageDataArray.slice(quarter, quarter + 4);
    const middle2 = imageDataArray.slice(Math.floor(imageDataArray.length * 0.5), Math.floor(imageDataArray.length * 0.5) + 4);
    const threeQuarter = Math.floor(imageDataArray.length * 0.75);
    const middle3 = imageDataArray.slice(threeQuarter, threeQuarter + 3);
    const last = imageDataArray.slice(-3);
    
    optimizedImageArray = [...first, ...middle1, ...middle2, ...middle3, ...last];
    
    // Update prompt with context about image selection
    promptText = `${promptText}\n\n**ANALYSIS CONTEXT:**\nAnalyzing ${optimizedImageArray.length} selected images from a total of ${imageDataArray.length} images for comprehensive property assessment.`;
  }

  // Create parts array with prompt text and images
  const parts = [
    { text: promptText },
    ...optimizedImageArray.map(data => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: data.startsWith('data:') ? data.split(',')[1] : data
      }
    }))
  ];

  // Optimized parameters for Gemini 2.0 Flash
  const generationConfig = {
    temperature: 0.2,  // Consistent for property analysis
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,  // Sufficient for detailed analysis
  };

  console.log(`⚙️ [GEMINI API] Request configured:`, {
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
 * Calls Gemini 2.0 Flash API with enhanced error handling
 * Uses the gemini-2.0-flash-exp endpoint (alias for gemini-2.0-flash)
 */
export async function callGeminiApi(
  apiKey: string, 
  request: GeminiRequest
): Promise<any> {
  // Use the experimental endpoint which is the alias for gemini-2.0-flash
  const MODEL_NAME = 'gemini-2.0-flash-exp';
  
  console.log(`🚀 [GEMINI API] Calling Gemini 2.0 Flash (${MODEL_NAME})`);
  
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error('Invalid or missing GEMINI_API_KEY. Expected format: AIza...');
  }
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GEMINI API] HTTP ${response.status} error:`, {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorText
      });
      
      // Provide specific error messages based on status code
      if (response.status === 400) {
        throw new Error(`Bad request to Gemini API. Check image format and prompt. Details: ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`Invalid API key. Please check your GEMINI_API_KEY. Details: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`API access forbidden. Check API key permissions and billing. Details: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please try again later. Details: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Gemini API server error (${response.status}). Please try again later. Details: ${errorText}`);
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Enhanced response validation
    if (!data.candidates || data.candidates.length === 0) {
      console.error(`❌ [GEMINI API] No candidates in response:`, data);
      throw new Error(`No analysis candidates returned from Gemini 2.0 Flash`);
    }
    
    const candidate = data.candidates[0];
    
    // Check for content filtering
    if (candidate.finishReason === 'SAFETY') {
      console.warn(`⚠️ [GEMINI API] Content filtered by safety settings`);
      throw new Error('Analysis was blocked by content safety filters');
    }
    
    if (candidate.finishReason === 'RECITATION') {
      console.warn(`⚠️ [GEMINI API] Content flagged for recitation`);
      throw new Error('Analysis was blocked due to recitation concerns');
    }
    
    if (!candidate.content?.parts?.[0]?.text) {
      console.error(`❌ [GEMINI API] Invalid response structure:`, candidate);
      throw new Error(`No text content returned from Gemini 2.0 Flash analysis`);
    }
    
    const textContent = candidate.content.parts[0].text;
    console.log(`✅ [GEMINI API] Gemini 2.0 Flash analysis completed: ${textContent.length} characters`);
    
    return textContent;
    
  } catch (error) {
    // Re-throw with enhanced context
    if (error instanceof Error) {
      console.error(`❌ [GEMINI API] Analysis failed:`, error.message);
      throw new Error(`Failed to analyze image with Gemini 2.0 Flash: ${error.message}`);
    } else {
      console.error(`❌ [GEMINI API] Unknown error:`, error);
      throw new Error(`Failed to analyze image with Gemini 2.0 Flash: Unknown error occurred`);
    }
  }
}
