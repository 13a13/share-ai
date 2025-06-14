
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
}

/**
 * Create successful response with organized image information
 */
export function createSuccessResponse(
  parsedData: any,
  componentName: string | undefined,
  propertyRoomInfo: PropertyRoomInfo | null,
  organizedImageUrls: string[],
  originalImageUrls: string[],
  isAdvancedAnalysis: boolean
): Response {
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
    console.log(`✅ Enhanced response with organized folder info: ${propertyRoomInfo.userAccountName}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}`);
  }

  // Add organized image URLs to response
  if (organizedImageUrls.length > 0) {
    formattedResponse.organizedImageUrls = organizedImageUrls;
    const organizedCount = organizedImageUrls.filter((url, index) => url !== originalImageUrls[index]).length;
    if (organizedCount > 0) {
      console.log(`📂 Successfully organized ${organizedCount}/${originalImageUrls.length} images into proper folder hierarchy`);
      formattedResponse.folderOrganizationApplied = organizedCount;
    }
  }

  console.log("✅ Successfully processed images with Gemini and organized into proper folder hierarchy");
  
  return new Response(
    JSON.stringify(formattedResponse),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Create error response
 */
export function createErrorResponse(error: Error, status: number = 500): Response {
  console.error("❌ Server error:", error);
  return new Response(
    JSON.stringify({ error: "Internal server error", details: error.message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create API configuration error response
 */
export function createApiErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Gemini API key not configured" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create fallback error response when AI processing fails
 */
export function createFallbackErrorResponse(componentName: string | undefined): Response {
  console.log("Returning fallback response");
  
  const fallbackResponse = createFallbackResponse(componentName);
  
  return new Response(
    JSON.stringify(fallbackResponse),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
