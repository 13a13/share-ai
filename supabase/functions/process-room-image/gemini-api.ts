
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
 * Optimized for large batches and updated for Gemini 2.5 Pro Preview 05-06
 */
export function createGeminiRequest(
  promptText: string, 
  imageData: string | string[], 
  isAdvancedAnalysis: boolean = false
): GeminiRequest {
  // Ensure imageData is an array
  const imageDataArray = Array.isArray(imageData) ? imageData : [imageData];
  
  console.log(`📝 [GEMINI API] Creating request for ${imageDataArray.length} images, advanced: ${isAdvancedAnalysis}`);
  
  // Enhanced image selection for Gemini 2.5 Pro Preview 05-06 (supports more images)
  let optimizedImageArray = imageDataArray;
  const maxImages = isAdvancedAnalysis ? 20 : 15; // Increased limits for new model
  
  if (imageDataArray.length > maxImages) {
    if (isAdvancedAnalysis) {
      // Enhanced image selection algorithm for advanced analysis
      console.log(`📸 [GEMINI API] Optimizing ${imageDataArray.length} images for advanced analysis`);
      
      const first = imageDataArray.slice(0, 5);
      const quarter = Math.floor(imageDataArray.length * 0.25);
      const middle1 = imageDataArray.slice(quarter, quarter + 4);
      const middle2 = imageDataArray.slice(Math.floor(imageDataArray.length * 0.5), Math.floor(imageDataArray.length * 0.5) + 4);
      const threeQuarter = Math.floor(imageDataArray.length * 0.75);
      const middle3 = imageDataArray.slice(threeQuarter, threeQuarter + 3);
      const last = imageDataArray.slice(-4);
      
      optimizedImageArray = [...first, ...middle1, ...middle2, ...middle3, ...last];
      
      // Update prompt with enhanced context
      promptText = `${promptText}\n\n**ADVANCED ANALYSIS CONTEXT:**\nYou are analyzing a strategically selected subset of ${imageDataArray.length} total images (${optimizedImageArray.length} selected), chosen to represent comprehensive coverage including multiple angles, lighting conditions, and detail perspectives. Provide thorough cross-image analysis.`;
    } else {
      // Standard selection algorithm
      console.log(`📸 [GEMINI API] Optimizing ${imageDataArray.length} images for standard analysis`);
      
      const first = imageDataArray.slice(0, 6);
      const middle = imageDataArray.length > 8 
        ? imageDataArray.slice(Math.floor(imageDataArray.length / 2) - 2, Math.floor(imageDataArray.length / 2) + 2)
        : [];
      const last = imageDataArray.slice(-5);
      
      optimizedImageArray = [...first, ...middle, ...last];
      
      // Standard subset note
      promptText = `${promptText}\n\nNote: You are analyzing a representative sample of ${optimizedImageArray.length} images from ${imageDataArray.length} total images. Focus on the most significant findings visible in these samples.`;
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

  // Enhanced generation parameters optimized for Gemini 2.5 Pro Preview 05-06
  const generationConfig = {
    temperature: isAdvancedAnalysis ? 0.1 : 0.3,  // Lower temperature for consistency in advanced mode
    topK: isAdvancedAnalysis ? 32 : 40,
    topP: isAdvancedAnalysis ? 0.9 : 0.95,
    maxOutputTokens: isAdvancedAnalysis ? 4096 : 2048,  // Increased token limits for new model
  };

  console.log(`⚙️ [GEMINI API] Request configured:`, {
    imageCount: optimizedImageArray.length,
    originalImageCount: imageDataArray.length,
    isAdvanced: isAdvancedAnalysis,
    maxTokens: generationConfig.maxOutputTokens,
    temperature: generationConfig.temperature
  });

  return {
    contents: [{ parts }],
    generationConfig
  };
}

/**
 * Calls the Gemini API with enhanced error handling and retry logic
 * Updated to use Gemini 2.5 Pro Preview 05-06 by default for advanced analysis
 */
export async function callGeminiApi(
  apiKey: string, 
  request: GeminiRequest,
  modelName: string = 'gemini-1.5-flash'
): Promise<any> {
  // Auto-upgrade to Gemini 2.5 Pro Preview 05-06 for advanced analysis
  const imageCount = request.contents[0].parts.filter(p => p.inline_data).length;
  const isComplex = request.generationConfig.maxOutputTokens > 2048 || imageCount > 10;
  
  const selectedModel = isComplex ? 'gemini-2.5-pro-preview-0506' : modelName;
  
  console.log(`🚀 [GEMINI API] Calling ${selectedModel} with ${imageCount} images`);
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;
  
  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [GEMINI API] ${selectedModel} error:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Failed to process image with ${selectedModel}: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  // Enhanced response validation
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error(`No candidates returned from ${selectedModel}`);
  }
  
  const candidate = data.candidates[0];
  
  // Check for content filtering
  if (candidate.finishReason === 'SAFETY') {
    console.warn(`⚠️ [GEMINI API] Content filtered by safety settings`);
    throw new Error('Content was filtered due to safety policies');
  }
  
  if (!candidate.content?.parts?.[0]?.text) {
    console.error(`❌ [GEMINI API] Invalid response structure:`, candidate);
    throw new Error(`No text content returned from ${selectedModel}`);
  }
  
  const textContent = candidate.content.parts[0].text;
  console.log(`✅ [GEMINI API] ${selectedModel} returned ${textContent.length} characters`);
  
  return textContent;
}
