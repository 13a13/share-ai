
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
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

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, roomType, componentType } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${componentType || 'room'} image for ${roomType || 'unknown room type'}`);

    // For base64 images, extract the data part
    let imageData = imageUrl;
    if (imageUrl.startsWith("data:")) {
      imageData = imageUrl.split(",")[1];
    }

    // Generate prompt based on component type
    const promptText = createPrompt(roomType, componentType);
    
    // Create and send request to Gemini API
    const geminiRequest = createGeminiRequest(promptText, imageData);
    
    try {
      // Call Gemini API and get the text response
      const textContent = await callGeminiApi(GEMINI_API_KEY, geminiRequest);
      
      // Extract JSON data from the text
      const parsedData = extractJsonFromText(textContent);
      
      // Format the response based on whether this is a component or full room
      const formattedResponse = formatResponse(parsedData, componentType);

      console.log("Successfully processed image with Gemini");
      
      return new Response(
        JSON.stringify(formattedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error processing with Gemini:", error);
      console.log("Returning fallback response");
      
      // Return a fallback response if processing fails
      const fallbackResponse = createFallbackResponse(componentType);
      
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
