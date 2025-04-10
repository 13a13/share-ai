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

// Use the provided API key directly
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
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
    
    const { imageUrls, componentName, roomType, inventoryMode = false, maxImages = 20 } = requestData;
    
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
    
    console.log(`Processing ${componentName || 'component'} with ${limitedImages.length} images for ${roomType || 'unknown room type'}`);

    // Extract base64 data from each image
    const imageDataArray = limitedImages.map(imageUrl => {
      if (imageUrl.startsWith("data:")) {
        return imageUrl.split(",")[1];
      }
      return imageUrl;
    });

    // Generate prompt based on inventory mode or component analysis
    let promptText;
    
    if (inventoryMode && componentName) {
      // Use the detailed inventory clerk prompt for component analysis
      promptText = createInventoryPrompt(componentName);
    } else {
      // Use the standard component prompt
      promptText = createPrompt(roomType, componentName, images.length > 1);
    }
    
    // Create and send request to Gemini API with all images
    const geminiRequest = createGeminiRequest(promptText, imageDataArray);
    
    try {
      // Call Gemini API and get the text response
      const textContent = await callGeminiApi(GEMINI_API_KEY, geminiRequest);
      
      let parsedData;
      
      if (inventoryMode && componentName) {
        // Parse the inventory clerk format response
        try {
          parsedData = parseInventoryResponse(textContent);
          console.log("Successfully parsed inventory response:", parsedData);
        } catch (parseError) {
          console.error("Failed to parse inventory response:", parseError);
          // Extract JSON if available as fallback
          parsedData = extractJsonFromText(textContent);
        }
      } else {
        // Extract JSON data from the text for standard component analysis
        parsedData = extractJsonFromText(textContent);
      }
      
      // Format the response based on whether this is a component or full room
      const formattedResponse = formatResponse(parsedData, componentName);

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
