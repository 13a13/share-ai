
/**
 * Standardized Gemini 2.0 Flash API - Single Source of Truth
 * Uses only gemini-2.0-flash-exp (the available model endpoint)
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
 * Note: gemini-2.0-flash-exp is the actual API endpoint name
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
 * Uses the gemini-2.0-flash-exp endpoint (the actual available model)
 */
export async function callGeminiApi(
  apiKey: string, 
  request: GeminiRequest
): Promise<any> {
  // Use the correct model endpoint that's actually available
  const MODEL_NAME = 'gemini-2.0-flash-exp';
  
  console.log(`🚀 [GEMINI API] Calling Gemini 2.0 Flash (${MODEL_NAME})`);
  
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error('Invalid or missing GEMINI_API_KEY. Expected format: AIza... Please check your API key in Supabase secrets.');
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
        throw new Error(`Gemini API request error: Invalid request format or parameters. Details: ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`Gemini API authentication failed: Invalid API key. Please check your GEMINI_API_KEY in Supabase secrets. Details: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`Gemini API access forbidden: Check API key permissions and billing status. Details: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Gemini API rate limit exceeded: Too many requests. Please try again later. Details: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Gemini API server error (${response.status}): Google's servers are experiencing issues. Please try again later. Details: ${errorText}`);
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Enhanced response validation
    if (!data.candidates || data.candidates.length === 0) {
      console.error(`❌ [GEMINI API] No candidates in response:`, data);
      throw new Error(`Gemini 2.0 Flash returned no analysis results. This may be due to content filtering or model limitations.`);
    }
    
    const candidate = data.candidates[0];
    
    // Check for content filtering
    if (candidate.finishReason === 'SAFETY') {
      console.warn(`⚠️ [GEMINI API] Content filtered by safety settings`);
      throw new Error('Image analysis was blocked by content safety filters. Please try with different images.');
    }
    
    if (candidate.finishReason === 'RECITATION') {
      console.warn(`⚠️ [GEMINI API] Content flagged for recitation`);
      throw new Error('Image analysis was blocked due to potential copyright concerns.');
    }
    
    if (!candidate.content?.parts?.[0]?.text) {
      console.error(`❌ [GEMINI API] Invalid response structure:`, candidate);
      throw new Error(`Gemini 2.0 Flash returned empty content. Please try again or contact support.`);
    }
    
    const textContent = candidate.content.parts[0].text;
    console.log(`✅ [GEMINI API] Gemini 2.0 Flash analysis completed: ${textContent.length} characters`);
    
    return textContent;
    
  } catch (error) {
    // Re-throw with enhanced context
    if (error instanceof Error) {
      console.error(`❌ [GEMINI API] Analysis failed:`, error.message);
      throw new Error(`Gemini 2.0 Flash analysis failed: ${error.message}`);
    } else {
      console.error(`❌ [GEMINI API] Unknown error:`, error);
      throw new Error(`Gemini 2.0 Flash analysis failed: An unexpected error occurred. Please try again.`);
    }
  }
}
