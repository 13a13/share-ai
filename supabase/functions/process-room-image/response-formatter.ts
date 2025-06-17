
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
  propertyRoomInfo: PropertyRoomInfo | null,
  organizedImageUrls: string[],
  originalImageUrls: string[],
  isAdvancedAnalysis: boolean,
  processingMetadata?: {
    modelUsed: string;
    costIncurred: number;
    processingTime: number;
    validationResult?: any;
    costSummary?: any;
  }
): Response {
  console.log(`📋 [RESPONSE FORMATTER] Creating enhanced success response`);
  
  // Format the response based on analysis mode
  const formattedResponse: FormattedResponse = isAdvancedAnalysis 
    ? formatAdvancedResponse(parsedData, componentName)
    : formatResponse(parsedData, componentName);

  // Add property and room information to the response
  if (propertyRoomInfo) {
    formattedResponse.propertyInfo = {
      propertyName: propertyRoomInfo.propertyName,
      roomName: propertyRoomInfo.roomName,
      roomType: propertyRoomInfo.roomType,
      userAccountName: propertyRoomInfo.userAccountName
    };
    console.log(`✅ [RESPONSE FORMATTER] Enhanced response with organized folder info: ${propertyRoomInfo.userAccountName}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}`);
  }

  // Add organized image URLs to response
  if (organizedImageUrls.length > 0) {
    formattedResponse.organizedImageUrls = organizedImageUrls;
    const organizedCount = organizedImageUrls.filter((url, index) => url !== originalImageUrls[index]).length;
    if (organizedCount > 0) {
      console.log(`📂 [RESPONSE FORMATTER] Successfully organized ${organizedCount}/${originalImageUrls.length} images into proper folder hierarchy`);
      formattedResponse.folderOrganizationApplied = organizedCount;
    }
  }

  // Add processing metadata
  if (processingMetadata) {
    formattedResponse.processingMetadata = {
      modelUsed: processingMetadata.modelUsed,
      costIncurred: processingMetadata.costIncurred,
      processingTime: processingMetadata.processingTime,
      geminiModel: processingMetadata.modelUsed, // Explicitly show Gemini model used
      enhancedProcessing: true
    };
    
    if (processingMetadata.validationResult) {
      formattedResponse.processingMetadata.validationResult = processingMetadata.validationResult;
    }
    
    if (processingMetadata.costSummary) {
      formattedResponse.processingMetadata.costSummary = processingMetadata.costSummary;
    }
    
    console.log(`💰 [RESPONSE FORMATTER] Added processing metadata: ${processingMetadata.modelUsed}, cost: $${processingMetadata.costIncurred.toFixed(4)}, time: ${processingMetadata.processingTime}ms`);
  }

  console.log(`✅ [RESPONSE FORMATTER] Successfully processed images with enhanced AI pipeline and organized into proper folder hierarchy`);
  
  return new Response(
    JSON.stringify(formattedResponse),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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
