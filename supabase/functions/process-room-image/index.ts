
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  createPrompt, 
  extractJsonFromText, 
  formatResponse, 
  createFallbackResponse 
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
  parseAdvancedAnalysisResponse,
  formatAdvancedResponse
} from "./advanced-analysis.ts";
import { getPropertyAndRoomInfo } from "./database-utils.ts";

// Use the provided API key directly
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    console.log("🚀 Room image processing function started");
    console.log("📥 Request data received:", JSON.stringify(requestData, null, 2));
    
    // Handle test connection request
    if (requestData.test === true) {
      if (!GEMINI_API_KEY) {
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
    
    if (!imageUrls || (Array.isArray(imageUrls) && imageUrls.length === 0)) {
      return new Response(
        JSON.stringify({ error: "At least one image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to array if single string was passed
    const images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    
    // Enforce maximum number of images
    const limitedImages = images.slice(0, maxImages);
    
    console.log(`📸 Processing ${componentName || 'component'} with ${limitedImages.length} images for ${roomType || 'unknown room type'}`);

    // Get correct property and room information from database if reportId is provided
    let propertyRoomInfo = null;
    if (reportId) {
      try {
        propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
        console.log(`🏠 Retrieved property and room info:`, propertyRoomInfo);
      } catch (error) {
        console.error('⚠️ Failed to fetch property/room info from database:', error);
        // Continue with processing even if database lookup fails
      }
    }

    // Extract base64 data from each image
    const imageDataArray = limitedImages.map(imageUrl => {
      if (imageUrl.startsWith("data:")) {
        return imageUrl.split(",")[1];
      }
      return imageUrl;
    });

    // Determine if we should use advanced analysis
    const shouldUseAdvancedAnalysis = useAdvancedAnalysis && 
                                      Array.isArray(limitedImages) && 
                                      limitedImages.length > 1;

    // Generate prompt based on analysis mode, using correct room type if available
    let promptText;
    const actualRoomType = propertyRoomInfo?.roomType || roomType || 'room';
    
    if (shouldUseAdvancedAnalysis) {
      promptText = createAdvancedMultiImagePrompt(
        componentName || 'component',
        actualRoomType,
        limitedImages.length
      );
      console.log("Using advanced multi-image analysis protocol");
    } else if (inventoryMode && componentName) {
      promptText = createInventoryPrompt(componentName);
    } else {
      promptText = createPrompt(actualRoomType, componentName, images.length > 1);
    }
    
    // Create and send request to Gemini API with all images
    const geminiRequest = createGeminiRequest(promptText, imageDataArray, shouldUseAdvancedAnalysis);
    
    try {
      // Call Gemini API and get the text response
      const textContent = await callGeminiApi(GEMINI_API_KEY, geminiRequest);
      
      let parsedData;
      
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
      
      // Format the response based on analysis mode
      const formattedResponse = shouldUseAdvancedAnalysis 
        ? formatAdvancedResponse(parsedData, componentName)
        : formatResponse(parsedData, componentName);

      // Add property and room information to the response for logging
      if (propertyRoomInfo) {
        formattedResponse.propertyInfo = {
          propertyName: propertyRoomInfo.propertyName,
          roomName: propertyRoomInfo.roomName,
          roomType: propertyRoomInfo.roomType
        };
        console.log(`✅ Enhanced response with property info: ${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}`);
      }

      console.log("Successfully processed images with Gemini");
      
      return new Response(
        JSON.stringify(formattedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error processing with Gemini:", error);
      console.log("Returning fallback response");
      
      // Return a fallback response if processing fails
      const fallbackResponse = createFallbackResponse(componentName);
      
      return new Response(
        JSON.stringify(fallbackResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
