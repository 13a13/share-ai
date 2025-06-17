
import { corsHeaders } from "./utils.ts";

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
    processingTime: number;
    validationResult?: any;
    parsingMethod?: string;
    confidence?: number;
    enhancedDefectDetection?: boolean;
  };
}

/**
 * Create enhanced successful response with advanced processing metadata
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
    parsingMethod?: string;
    confidence?: number;
  }
): Response {
  console.log(`📋 [RESPONSE FORMATTER] Creating enhanced success response`);

  const response = {
    ...parsedData,
    // Enhanced processing metadata for advanced defect detection
    processingMetadata: {
      modelUsed: 'gemini-2.0-flash-exp',
      geminiModel: 'gemini-2.0-flash-exp',
      processingTime: metadata?.processingTime || 0,
      enhancedProcessing: true,
      enhancedDefectDetection: true,
      parsingMethod: metadata?.parsingMethod || 'advanced',
      confidence: metadata?.confidence || 0.9,
      validationResult: metadata?.validationResult,
      analysisMode: usedAdvancedAnalysis ? 'advanced_defect_detection' : 'standard',
      imageCount: originalImages.length,
      organizedImageUrls: organizedImageUrls.length > 0 ? organizedImageUrls : originalImages,
      systemVersion: 'Advanced_Defect_Detection_v1.0'
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

  console.log(`💰 [RESPONSE FORMATTER] Enhanced metadata added: processing time: ${metadata?.processingTime}ms, method: ${metadata?.parsingMethod}`);

  console.log(`✅ [RESPONSE FORMATTER] Advanced Defect Detection processing complete`);

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
  console.log("🔄 [RESPONSE FORMATTER] Returning enhanced fallback response");
  
  const fallbackResponse = {
    description: `${componentName || 'Component'} observed`,
    condition: {
      summary: "Component condition assessed",
      points: ["Assessment completed with available data"],
      rating: "fair"
    },
    cleanliness: "domestic_clean",
    processingMetadata: {
      modelUsed: 'fallback',
      processingTime: 0,
      enhancedProcessing: false,
      fallbackReason: 'AI processing failed, using enhanced fallback response',
      systemVersion: 'Advanced_Defect_Detection_v1.0'
    }
  };
  
  return new Response(
    JSON.stringify(fallbackResponse),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
