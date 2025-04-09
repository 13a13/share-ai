
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
      promptText = `YOU ARE A PROFESSIONAL PROPERTY INVENTORY CLERK.

YOU ARE ANALYSING MULTIPLE PHOTOS OF THE FOLLOWING COMPONENT: **${componentName}**.

YOUR ROLE IS TO GENERATE CONSISTENT, AUDITABLE INVENTORY RECORDS. YOUR JUDGEMENT MUST BE STANDARDISED ACROSS ALL REPORTS — NEVER SUBJECTIVE OR RELATIVE TO ROOM QUALITY.

ALWAYS APPLY THE FOLLOWING OBJECTIVE BENCHMARKS — THESE DO NOT CHANGE BETWEEN PROPERTIES OR PHOTOS:

---

CLEANLINESS SCALE (USE EXACTLY):
- PROFESSIONAL CLEAN → NO VISIBLE DIRT, SMEARS, DUST, OR RESIDUE. SUITABLE FOR MOVE-IN WITHOUT ADDITIONAL CLEANING.  
- PROFESSIONAL CLEAN WITH OMISSIONS → MOST SURFACES CLEANED TO A HIGH STANDARD BUT ONE OR TWO AREAS MISSED.  
- DOMESTIC CLEAN TO A HIGH LEVEL → VISIBLY CLEAN WITH LIGHT DUST IN INACCESSIBLE AREAS. EVIDENCE OF CARE.  
- DOMESTIC CLEAN → SURFACES CLEANED BUT MAY BE PATCHY OR INCOMPLETE.  
- NOT CLEAN → NOTICEABLE DIRT, SMEARS, DEBRIS, OR NEGLECT.

---

CONDITION RATINGS (USE THESE DEFINITIONS):

- GOOD ORDER → CLEAN, UNDAMAGED, NO SIGNS OF WEAR. APPEARS AS NEW OR WELL-MAINTAINED.  
- USED ORDER → FUNCTIONAL WITH MINOR COSMETIC WEAR (E.G., SCUFFS, FAINT SCRATCHES) BUT NO STRUCTURAL ISSUES.  
- FAIR ORDER → MODERATE WEAR OR COSMETIC DAMAGE VISIBLE. FIT FOR USE BUT NOT PRESENTABLE WITHOUT MAINTENANCE.  
- DAMAGED → STRUCTURALLY OR FUNCTIONALLY AFFECTED. CHIPPED, BROKEN, SEVERELY SCRATCHED, OR NEEDS REPAIR.

---

YOUR TASK:

1. DESCRIPTION:
   - WRITE ONE CLERK-STYLE SENTENCE USING THIS EXACT ORDER:
     [COLOUR] + [MATERIAL] + [OBJECT] + [KEY FEATURES / STYLE]
   - NO OPINIONS OR FLUFF.

2. CONDITION:
   - BULLET POINTS ONLY.
   - NOTE WEAR, DAMAGE, MISALIGNMENT, DEGRADATION, INSTALLATION ISSUES.

3. CLEANLINESS:
   - SELECT ONE FROM THE STANDARDISED SCALE ABOVE.

4. OVERALL RATING:
   - SELECT ONE FROM THE STANDARDISED CONDITION RATINGS ABOVE.

---

OUTPUT THIS EXACT FORMAT:

DESCRIPTION:  
[ONE SENTENCE – COLOUR, MATERIAL, OBJECT, FEATURES]

CONDITION:  
- [BULLET POINT 1]  
- [BULLET POINT 2]  
- [BULLET POINT 3] (IF NEEDED)

CLEANLINESS:  
[PROFESSIONAL CLEAN / PROFESSIONAL CLEAN WITH OMISSIONS / DOMESTIC CLEAN TO A HIGH LEVEL / DOMESTIC CLEAN / NOT CLEAN]

RATING:  
[GOOD ORDER / USED ORDER / FAIR ORDER / DAMAGED]`;
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

// Parse the inventory clerk format response
function parseInventoryResponse(text: string): any {
  // Extract sections from the formatted text
  const descriptionMatch = text.match(/DESCRIPTION:\s*([^\n]+)/i);
  const conditionMatch = text.match(/CONDITION:([\s\S]*?)(?=CLEANLINESS:|$)/i);
  const cleanlinessMatch = text.match(/CLEANLINESS:\s*([^\n]+)/i);
  const ratingMatch = text.match(/RATING:\s*([^\n]+)/i);
  
  // Extract bullet points from the condition section
  const bulletPoints: string[] = [];
  if (conditionMatch && conditionMatch[1]) {
    const bulletPointsText = conditionMatch[1].trim();
    const bulletPointMatches = bulletPointsText.match(/- ([^\n]+)/g);
    if (bulletPointMatches) {
      bulletPointMatches.forEach(point => {
        bulletPoints.push(point.replace('- ', '').trim());
      });
    }
  }
  
  // Map cleanliness value to standard rating
  const cleanlinessValue = cleanlinessMatch ? cleanlinessMatch[1].trim() : null;
  const ratingValue = ratingMatch ? ratingMatch[1].trim() : null;
  
  // Map rating to condition value
  let conditionRating: string;
  switch (ratingValue?.toLowerCase()) {
    case 'good order':
      conditionRating = 'excellent';
      break;
    case 'used order':
      conditionRating = 'good';
      break;
    case 'fair order':
      conditionRating = 'fair';
      break;
    case 'damaged':
      conditionRating = 'poor';
      break;
    default:
      conditionRating = 'fair';
  }
  
  return {
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    condition: {
      summary: bulletPoints.join('\n'),
      points: bulletPoints,
      rating: conditionRating
    },
    cleanliness: cleanlinessValue || '',
    rating: ratingValue || ''
  };
}
