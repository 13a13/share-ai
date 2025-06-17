
import { 
  createPrompt, 
  extractJsonFromText 
} from "./utils.ts";
import { 
  callGeminiApi, 
  createGeminiRequest 
} from "./gemini-api.ts";
import {
  parseInventoryResponse,
  createInventoryPrompt
} from "./inventory-parser.ts";
import {
  createAdvancedMultiImagePrompt,
  parseAdvancedAnalysisResponse
} from "./advanced-analysis.ts";
import type { AIProcessingOptions } from './ai-processing-options.ts';

/**
 * Simplified image processing with Gemini 2.5 Pro exclusively
 */
export async function processImagesWithAI(
  processedImages: string[],
  options: AIProcessingOptions,
  apiKey: string
): Promise<any> {
  const { componentName, roomType, inventoryMode, useAdvancedAnalysis, imageCount } = options;

  console.log(`🤖 [PROCESS AI] Using Gemini 2.5 Pro exclusively for ${imageCount} images`);

  // Always use advanced analysis for multiple images with Gemini 2.5 Pro
  const shouldUseAdvancedAnalysis = useAdvancedAnalysis || imageCount > 1;

  // Generate prompt optimized for Gemini 2.5 Pro
  let promptText: string;

  if (shouldUseAdvancedAnalysis) {
    promptText = createAdvancedMultiImagePrompt(
      componentName || 'component',
      roomType,
      imageCount
    );
    console.log("🔬 [PROCESS AI] Using advanced multi-image analysis for Gemini 2.5 Pro");
  } else if (inventoryMode && componentName) {
    promptText = createInventoryPrompt(componentName);
    console.log("📋 [PROCESS AI] Using inventory mode for Gemini 2.5 Pro");
  } else {
    promptText = createPrompt(roomType, componentName, imageCount > 1);
    console.log("🏠 [PROCESS AI] Using standard analysis for Gemini 2.5 Pro");
  }

  // Create and send request to Gemini 2.5 Pro
  const geminiRequest = createGeminiRequest(promptText, processedImages);

  // Call Gemini 2.5 Pro and get the text response
  const textContent = await callGeminiApi(apiKey, geminiRequest);

  // Parse the response based on analysis mode
  let parsedData: any;

  if (shouldUseAdvancedAnalysis) {
    try {
      parsedData = parseAdvancedAnalysisResponse(textContent);
      console.log("✅ [PROCESS AI] Successfully parsed advanced analysis response");
    } catch (parseError) {
      console.error("❌ [PROCESS AI] Failed to parse advanced analysis response:", parseError);
      try {
        parsedData = parseInventoryResponse(textContent);
      } catch {
        parsedData = extractJsonFromText(textContent);
      }
    }
  } else if (inventoryMode && componentName) {
    try {
      parsedData = parseInventoryResponse(textContent);
      console.log("✅ [PROCESS AI] Successfully parsed inventory response");
    } catch (parseError) {
      console.error("❌ [PROCESS AI] Failed to parse inventory response:", parseError);
      parsedData = extractJsonFromText(textContent);
    }
  } else {
    parsedData = extractJsonFromText(textContent);
  }

  return { parsedData, shouldUseAdvancedAnalysis };
}
