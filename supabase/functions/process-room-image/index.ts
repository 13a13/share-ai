
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  handleCorsRequest,
  handleTestRequest,
  validateRequest,
  parseRequestData,
  ProcessImageRequest
} from "./request-handler.ts";
import {
  processAndOrganizeImages
} from "./image-processor.ts";
import {
  processImagesWithAI
} from "./ai-processor.ts";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createApiErrorResponse,
  createFallbackErrorResponse
} from "./response-formatter.ts";

// Use the provided API key directly
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return handleCorsRequest();
  }

  try {
    const requestData: ProcessImageRequest = await req.json();
    
    console.log("🚀 Room image processing function started");
    console.log("📥 Request data received:", JSON.stringify(requestData, null, 2));
    
    // Handle test connection request
    if (requestData.test === true) {
      return handleTestRequest(GEMINI_API_KEY);
    }
    
    // Validate request
    const validationError = validateRequest(requestData);
    if (validationError) {
      return createValidationErrorResponse(validationError);
    }

    if (!GEMINI_API_KEY) {
      return createApiErrorResponse();
    }

    // Parse and normalize request data
    const {
      images,
      componentName,
      roomType,
      reportId,
      roomId,
      inventoryMode,
      useAdvancedAnalysis
    } = parseRequestData(requestData);

    try {
      // Process and organize images
      const { processedImages, organizedImageUrls, propertyRoomInfo } = await processAndOrganizeImages(
        images,
        componentName,
        reportId,
        roomId
      );

      // Process images with AI
      const actualRoomType = propertyRoomInfo?.roomType || roomType || 'room';
      const { parsedData, shouldUseAdvancedAnalysis } = await processImagesWithAI(
        processedImages,
        {
          componentName,
          roomType: actualRoomType,
          inventoryMode,
          useAdvancedAnalysis,
          imageCount: images.length
        },
        GEMINI_API_KEY
      );

      // Create and return successful response
      return createSuccessResponse(
        parsedData,
        componentName,
        propertyRoomInfo,
        organizedImageUrls,
        images,
        shouldUseAdvancedAnalysis
      );

    } catch (error) {
      console.error("❌ Error processing with Gemini:", error);
      return createFallbackErrorResponse(componentName);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});
