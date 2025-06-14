
import { corsHeaders } from "./utils.ts";

export interface ProcessImageRequest {
  imageUrls: string | string[];
  componentName?: string;
  roomType?: string;
  reportId?: string;
  roomId?: string;
  inventoryMode?: boolean;
  useAdvancedAnalysis?: boolean;
  multipleImages?: boolean;
  maxImages?: number;
  test?: boolean;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Handle test connection requests
 */
export function handleTestRequest(apiKey: string | undefined): Response {
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured", configured: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ message: "Gemini API key is configured", configured: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Validate the incoming request data
 */
export function validateRequest(requestData: ProcessImageRequest): string | null {
  const { imageUrls } = requestData;
  
  if (!imageUrls || (Array.isArray(imageUrls) && imageUrls.length === 0)) {
    return "At least one image URL is required";
  }
  
  return null; // No validation errors
}

/**
 * Parse and normalize request data
 */
export function parseRequestData(requestData: ProcessImageRequest) {
  const { 
    imageUrls, 
    componentName, 
    roomType, 
    reportId,
    roomId,
    inventoryMode = false, 
    useAdvancedAnalysis = false,
    multipleImages = false,
    maxImages = 20 
  } = requestData;

  // Convert to array if single string was passed
  const images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  
  // Enforce maximum number of images
  const limitedImages = images.slice(0, maxImages);
  
  return {
    images: limitedImages,
    componentName,
    roomType,
    reportId,
    roomId,
    inventoryMode,
    useAdvancedAnalysis,
    multipleImages,
    maxImages
  };
}
