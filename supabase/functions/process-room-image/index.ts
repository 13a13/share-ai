
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
import { SimplifiedAIProcessor } from "./simplified-ai-processor.ts";
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
    
    console.log("🚀 Simplified Gemini 2.5 Pro processing function started");
    console.log("📥 Request data received:", JSON.stringify({
      imageCount: Array.isArray(requestData.imageUrls) ? requestData.imageUrls.length : 1,
      componentName: requestData.componentName,
      roomType: requestData.roomType,
      reportId: requestData.reportId,
      roomId: requestData.roomId,
      inventoryMode: requestData.inventoryMode,
      useAdvancedAnalysis: requestData.useAdvancedAnalysis
    }, null, 2));
    
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
      console.log(`🔄 [MAIN] Starting simplified Gemini 2.5 Pro pipeline`);
      
      // Process and organize images
      const { processedImages, organizedImageUrls, propertyRoomInfo } = await processAndOrganizeImages(
        images,
        componentName,
        reportId,
        roomId
      );

      // Simplified AI processing with Gemini 2.5 Pro exclusively
      const aiProcessor = new SimplifiedAIProcessor();
      const actualRoomType = propertyRoomInfo?.roomType || roomType || 'room';
      
      const result = await aiProcessor.processWithGemini25Pro(
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

      console.log(`✅ [MAIN] Simplified processing complete:`, {
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        validationApplied: !!result.validationResult
      });

      // Create and return simplified response
      return createSuccessResponse(
        result.parsedData,
        componentName,
        propertyRoomInfo,
        organizedImageUrls,
        images,
        true, // Always use advanced analysis flag for Gemini 2.5 Pro
        {
          modelUsed: result.modelUsed,
          processingTime: result.processingTime,
          validationResult: result.validationResult,
          geminiModel: 'gemini-2.5-pro-preview-0506',
          enhancedProcessing: true
        }
      );

    } catch (error) {
      console.error("❌ Error in simplified Gemini 2.5 Pro pipeline:", error);
      
      // Simplified error handling (no fallbacks)
      if (error.message.includes('Rate limit')) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded", 
            details: error.message,
            suggestion: "Please wait a moment and try again."
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
            } 
          }
        );
      }
      
      return createFallbackErrorResponse(componentName);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});
