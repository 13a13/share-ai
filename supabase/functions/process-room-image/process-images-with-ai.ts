
import { 
  createPrompt, 
  extractJsonFromText 
} from "./utils.ts";
import { 
  callGeminiApi, 
  createGeminiRequest 
} from "./gemini-api.ts";
import { createUniversalPrompt, parseUniversalResponse } from "./universal-prompt.ts";
import type { AIProcessingOptions } from './ai-processing-options.ts';

/**
 * Simplified image processing with universal prompt
 */
export async function processImagesWithAI(
  processedImages: string[],
  options: AIProcessingOptions,
  apiKey: string
): Promise<any> {
  const { componentName, roomType, imageCount } = options;

  console.log(`🤖 [PROCESS AI] Using universal prompt for ${imageCount} images`);

  // Generate universal prompt
  const promptText = createUniversalPrompt(
    componentName || 'component',
    roomType,
    imageCount
  );
  console.log("📝 [PROCESS AI] Using universal prompt for comprehensive analysis");

  // Create and send request to Gemini
  const geminiRequest = createGeminiRequest(promptText, processedImages);

  // Call Gemini and get the text response
  const textContent = await callGeminiApi(apiKey, geminiRequest);

  // Parse the response using universal parser
  const parsedData = parseUniversalResponse(textContent);
  console.log("✅ [PROCESS AI] Successfully parsed universal response");

  return { parsedData, shouldUseAdvancedAnalysis: imageCount > 1 };
}
