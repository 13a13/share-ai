
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

    // For base64 images, we need to extract the data part
    let imageData = imageUrl;
    if (imageUrl.startsWith("data:")) {
      imageData = imageUrl.split(",")[1];
    }

    // Prepare prompt for Gemini based on the room type and component
    let promptText = "";

    if (componentType) {
      // Component-specific analysis
      const componentDescription = componentType.replace('_', ' ');
      promptText = `This is an image of ${componentDescription} in a ${roomType || 'room'}. 
        Provide a detailed assessment of this specific component. 
        Describe its appearance, condition, any visible damage or wear, and cleanliness.
        Format your response as a JSON object with these fields:
        {
          "description": "detailed description of the component",
          "condition": "excellent|good|fair|poor|needs_replacement",
          "notes": "suggested notes about any issues that need attention"
        }`;
    } else {
      // Full room analysis (original behavior)
      const roomTypeDescription = roomType 
        ? `This is a ${roomType.replace('_', ' ')}. `
        : "This is a room. ";

      promptText = `${roomTypeDescription}Analyze this room image and provide a detailed assessment. 
        Identify objects, their condition and description. Also provide an overall room assessment including
        general condition, walls, ceiling, flooring, doors, windows, lighting, furniture (if visible), 
        appliances (if visible), and cleaning needs. Format your response as structured data that I can parse as JSON.`;
    }

    // Prepare the request for Gemini API
    const geminiRequest = {
      contents: [
        {
          parts: [
            { text: promptText },
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
      
      // Format the response based on whether this is a component or full room
      let formattedResponse;
      
      if (componentType) {
        // For component analysis
        formattedResponse = {
          description: parsedData.description || "No description available",
          condition: parsedData.condition || "fair",
          notes: parsedData.notes || "",
        };
      } else {
        // For full room analysis (original behavior)
        formattedResponse = {
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
      }

      console.log("Successfully processed image with Gemini");
      
      return new Response(
        JSON.stringify(formattedResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error parsing Gemini response as JSON:", error);
      console.log("Raw response:", textContent);
      
      // Return a fallback structured response based on whether this is a component or full room
      if (componentType) {
        return new Response(
          JSON.stringify({
            description: "Could not determine from image",
            condition: "fair",
            notes: "AI analysis failed, please add manual description"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
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
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
