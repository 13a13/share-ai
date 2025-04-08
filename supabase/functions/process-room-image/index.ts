
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, roomType } = await req.json();
    
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

    console.log("Processing room image:", roomType);

    // For base64 images, we need to extract the data part
    let imageData = imageUrl;
    if (imageUrl.startsWith("data:")) {
      imageData = imageUrl.split(",")[1];
    }

    // Prepare prompt for Gemini based on the room type
    const roomTypeDescription = roomType 
      ? `This is a ${roomType.replace('_', ' ')}. `
      : "This is a room. ";

    const prompt = `${roomTypeDescription}Analyze this room image and provide a detailed assessment. Identify objects, their condition and description. Also provide an overall room assessment including general condition, walls, ceiling, flooring, doors, windows, lighting, furniture (if visible), appliances (if visible), and cleaning needs. Format your response as structured data that I can parse as JSON.`;

    // Prepare the request for Gemini API
    const geminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process image with Gemini", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiResponse = await response.json();
    
    // Extract the text content from Gemini response
    const textContent = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "No content returned from Gemini API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to extract JSON from the response
    try {
      // Look for JSON structure in the text
      let jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                      textContent.match(/{[\s\S]*}/);
      
      let jsonContent;
      if (jsonMatch) {
        jsonContent = jsonMatch[0].replace(/```json\n|```/g, '');
      } else {
        jsonContent = textContent;
      }
      
      // Parse the JSON content
      const parsedData = JSON.parse(jsonContent);
      
      // Validate the parsed data has expected structure
      const formattedResponse = {
        objects: parsedData.objects || [],
        roomAssessment: parsedData.roomAssessment || {
          generalCondition: "Unknown",
          walls: "Unknown",
          ceiling: "Unknown",
          flooring: "Unknown",
          doors: "Unknown",
          windows: "Unknown",
          lighting: "Unknown",
          cleaning: "Needs regular cleaning"
        }
      };

      console.log("Successfully processed image with Gemini");
      
      return new Response(
        JSON.stringify(formattedResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error parsing Gemini response as JSON:", error);
      console.log("Raw response:", textContent);
      
      // Return a fallback structured response
      return new Response(
        JSON.stringify({
          objects: [{ name: "Unknown", condition: "Unknown", description: "Could not identify objects" }],
          roomAssessment: {
            generalCondition: "Could not determine from image",
            walls: "Unknown",
            ceiling: "Unknown",
            flooring: "Unknown",
            doors: "Unknown",
            windows: "Unknown",
            lighting: "Unknown",
            cleaning: "Unknown"
          }
        }),
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
