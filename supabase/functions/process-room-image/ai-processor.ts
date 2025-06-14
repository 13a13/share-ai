
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

export interface AIProcessingOptions {
  componentName: string | undefined;
  roomType: string;
  inventoryMode: boolean;
  useAdvancedAnalysis: boolean;
  imageCount: number;
}

/**
 * Process images with AI and return parsed results
 */
export async function processImagesWithAI(
  processedImages: string[],
  options: AIProcessingOptions,
  apiKey: string
): Promise<any> {
  const { componentName, roomType, inventoryMode, useAdvancedAnalysis, imageCount } = options;

  // Determine if we should use advanced analysis
  const shouldUseAdvancedAnalysis = useAdvancedAnalysis && imageCount > 1;

  // Generate prompt based on analysis mode
  let promptText: string;
  
  if (shouldUseAdvancedAnalysis) {
    promptText = createAdvancedMultiImagePrompt(
      componentName || 'component',
      roomType,
      imageCount
    );
    console.log("Using advanced multi-image analysis protocol");
  } else if (inventoryMode && componentName) {
    promptText = createInventoryPrompt(componentName);
  } else {
    promptText = createPrompt(roomType, componentName, imageCount > 1);
  }
  
  // Create and send request to Gemini API with all images
  const geminiRequest = createGeminiRequest(promptText, processedImages, shouldUseAdvancedAnalysis);
  
  // Call Gemini API and get the text response
  const textContent = await callGeminiApi(apiKey, geminiRequest);
  
  // Parse the response based on analysis mode
  let parsedData: any;
  
  if (shouldUseAdvancedAnalysis) {
    try {
      parsedData = parseAdvancedAnalysisResponse(textContent);
      console.log("Successfully parsed advanced multi-image analysis response");
    } catch (parseError) {
      console.error("Failed to parse advanced analysis response:", parseError);
      try {
        parsedData = parseInventoryResponse(textContent);
      } catch {
        parsedData = extractJsonFromText(textContent);
      }
    }
  } else if (inventoryMode && componentName) {
    try {
      parsedData = parseInventoryResponse(textContent);
      console.log("Successfully parsed inventory response");
    } catch (parseError) {
      console.error("Failed to parse inventory response:", parseError);
      parsedData = extractJsonFromText(textContent);
    }
  } else {
    parsedData = extractJsonFromText(textContent);
  }

  return { parsedData, shouldUseAdvancedAnalysis };
}
