import { corsHeaders, formatResponse, createFallbackResponse } from "./utils.ts";
import { formatAdvancedResponse } from "./advanced-analysis.ts";
import { PropertyRoomInfo } from "./database-utils.ts";

export interface FormattedResponse {
  [key: string]: any;
  propertyInfo?: {
    propertyName: string;
    roomName: string;
    roomType: string;
    userAccountName: string;
  };
  organizedImageUrls?: string[];
  folderOrganizationApplied?: number;
  processingMetadata?: {
    modelUsed: string;
    costIncurred: number;
    processingTime: number;
    validationResult?: any;
    costSummary?: any;
  };
}

/**
 * Create enhanced successful response with organized image information and processing metadata
 */
export function createSuccessResponse(
  parsedData: any,
  componentName: string | undefined,
  propertyRoomInfo: any,
  organizedImageUrls: string[],
  originalImages: string[],
  usedAdvancedAnalysis: boolean,
  metadata?: {
    modelUsed?: string;
    processingTime?: number;
    validationResult?: any;
    geminiModel?: string;
    enhancedProcessing?: boolean;
  }
): Response {
  console.log(`📋 [RESPONSE FORMATTER] Creating simplified success response for Gemini 2.5 Pro`);

  const response = {
    ...parsedData,
    // Enhanced processing metadata specifically for Gemini 2.5 Pro
    processingMetadata: {
      modelUsed: 'gemini-2.5-pro-preview-0506',
      geminiModel: 'gemini-2.5-pro-preview-0506',
      processingTime: metadata?.processingTime || 0,
      enhancedProcessing: true,
      validationResult: metadata?.validationResult,
      analysisMode: usedAdvancedAnalysis ? 'advanced' : 'standard',
      imageCount: originalImages.length,
      organizedImageUrls: organizedImageUrls.length > 0 ? organizedImageUrls : originalImages
    }
  };

  // Add property/room context if available
  if (propertyRoomInfo) {
    response.processingMetadata.propertyContext = {
      propertyName: propertyRoomInfo.propertyName,
      roomName: propertyRoomInfo.roomName,
      roomType: propertyRoomInfo.roomType
    };
  }

  console.log(`💰 [RESPONSE FORMATTER] Added Gemini 2.5 Pro metadata: processing time: ${metadata?.processingTime}ms`);

  console.log(`✅ [RESPONSE FORMATTER] Successfully processed images with Gemini 2.5 Pro exclusively`);

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  });
}

/**
 * Create error response
 */
export function createErrorResponse(error: Error, status: number = 500): Response {
  console.error("❌ [RESPONSE FORMATTER] Server error:", error);
  return new Response(
    JSON.stringify({ error: "Internal server error", details: error.message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(message: string): Response {
  console.error("⚠️ [RESPONSE FORMATTER] Validation error:", message);
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create API configuration error response
 */
export function createApiErrorResponse(): Response {
  console.error("❌ [RESPONSE FORMATTER] API configuration error: Gemini API key not configured");
  return new Response(
    JSON.stringify({ error: "Gemini API key not configured" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create fallback error response when AI processing fails
 */
export function createFallbackErrorResponse(componentName: string | undefined): Response {
  console.log("🔄 [RESPONSE FORMATTER] Returning fallback response due to processing failure");
  
  const fallbackResponse = createFallbackResponse(componentName);
  
  // Add processing metadata to indicate fallback was used
  fallbackResponse.processingMetadata = {
    modelUsed: 'fallback',
    costIncurred: 0,
    processingTime: 0,
    enhancedProcessing: false,
    fallbackReason: 'AI processing failed, using fallback response'
  };
  
  return new Response(
    JSON.stringify(fallbackResponse),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
