
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
import { AIProcessor } from "./ai-processor.ts";
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
    
    console.log("🚀 Enhanced room image processing function started");
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
      console.log(`🔄 [MAIN] Starting enhanced processing pipeline`);
      
      // Process and organize images
      const { processedImages, organizedImageUrls, propertyRoomInfo } = await processAndOrganizeImages(
        images,
        componentName,
        reportId,
        roomId
      );

      // Enhanced AI processing with cost management and fallback
      const aiProcessor = new AIProcessor();
      const actualRoomType = propertyRoomInfo?.roomType || roomType || 'room';
      
      const enhancedResult = await aiProcessor.processImagesWithEnhancedAI(
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

      console.log(`✅ [MAIN] Enhanced processing complete:`, {
        modelUsed: enhancedResult.modelUsed,
        costIncurred: enhancedResult.costIncurred,
        processingTime: enhancedResult.processingTime,
        validationApplied: !!enhancedResult.validationResult
      });

      // Create and return enhanced response
      return createSuccessResponse(
        enhancedResult.parsedData,
        componentName,
        propertyRoomInfo,
        organizedImageUrls,
        images,
        enhancedResult.shouldUseAdvancedAnalysis,
        {
          modelUsed: enhancedResult.modelUsed,
          costIncurred: enhancedResult.costIncurred,
          processingTime: enhancedResult.processingTime,
          validationResult: enhancedResult.validationResult,
          costSummary: aiProcessor.getCostSummary()
        }
      );

    } catch (error) {
      console.error("❌ Error in enhanced processing pipeline:", error);
      
      // Provide detailed error information for debugging
      if (error.message.includes('Budget limit reached')) {
        return new Response(
          JSON.stringify({ 
            error: "Budget limit reached", 
            details: error.message,
            suggestion: "Please try again later or contact support to increase your budget limit."
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
