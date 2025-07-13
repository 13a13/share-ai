
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// CORS headers for web app integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🚀 Edge Function Started - Process Room Image');

serve(async (req) => {
  console.log('🔄 [MAIN] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [MAIN] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Add a simple health check endpoint
  if (req.url.includes('health')) {
    console.log('✅ [MAIN] Health check requested');
    return new Response(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      geminiConfigured: !!Deno.env.get('GEMINI_API_KEY')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('📥 [MAIN] Processing request body...');
    
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('📄 [MAIN] Raw request body length:', bodyText.length);
      console.log('📄 [MAIN] Raw request body preview:', bodyText.substring(0, 200) + '...');
      
      requestData = JSON.parse(bodyText);
      console.log('✅ [MAIN] Successfully parsed request JSON');
    } catch (jsonError) {
      console.error('❌ [MAIN] Failed to parse request JSON:', jsonError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request',
          details: jsonError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { imageUrls, componentName, roomType } = requestData;
    
    console.log('📊 [MAIN] Request data:', {
      imageCount: imageUrls?.length || 0,
      componentName,
      roomType,
      hasImageUrls: !!imageUrls,
      isImageUrlsArray: Array.isArray(imageUrls)
    });

    // Validation
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error('❌ [MAIN] No valid image URLs provided');
      return new Response(
        JSON.stringify({
          error: 'No image URLs provided',
          received: { imageUrls, componentName, roomType }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!componentName || !roomType) {
      console.error('❌ [MAIN] Missing required parameters');
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          required: ['imageUrls', 'componentName', 'roomType'],
          received: { componentName, roomType }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('❌ [MAIN] GEMINI_API_KEY not found');
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY not configured',
          details: 'Server configuration error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('🔑 [MAIN] Gemini API key found, length:', geminiApiKey.length);

    // Process images
    console.log(`🖼️ [MAIN] Processing ${imageUrls.length} images for ${componentName}`);
    
    const imageParts = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`📸 [Image ${i + 1}] Processing: ${imageUrl.substring(0, 100)}...`);
      
      try {
        if (imageUrl.startsWith('data:image/')) {
          console.log(`📋 [Image ${i + 1}] Processing base64 data URL`);
          const [header, base64Data] = imageUrl.split(',');
          const mimeMatch = header.match(/data:([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          
          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
          console.log(`✅ [Image ${i + 1}] Successfully processed base64 data`);
        } else {
          console.log(`🔗 [Image ${i + 1}] Using direct URL`);
          imageParts.push({
            fileData: {
              fileUri: imageUrl,
              mimeType: 'image/jpeg'
            }
          });
          console.log(`✅ [Image ${i + 1}] Successfully added direct URL`);
        }
      } catch (imageError) {
        console.error(`❌ [Image ${i + 1}] Error processing:`, imageError);
        // Continue with other images
      }
    }

    if (imageParts.length === 0) {
      console.error('❌ [MAIN] No images could be processed');
      return new Response(
        JSON.stringify({
          error: 'No images could be processed',
          details: 'All image processing failed'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🖼️ [MAIN] Successfully prepared ${imageParts.length} images`);

    // Create prompt
    const prompt = `Analyze these ${imageParts.length} image(s) of a ${componentName} in a ${roomType}. 

Provide a detailed assessment in JSON format with the following structure:
{
  "description": "Detailed description of what you see",
  "condition": {
    "summary": "Overall condition summary",
    "points": ["Key observation 1", "Key observation 2"],
    "rating": "excellent|good|fair|poor|critical"
  },
  "cleanliness": "professional_clean|domestic_clean|not_clean"
}

Be specific about any defects, wear, or maintenance issues you observe.`;

    console.log('📝 [MAIN] Generated prompt, length:', prompt.length);

    // Initialize Gemini
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(geminiApiKey);
      console.log('✅ [MAIN] Gemini AI initialized');
    } catch (initError) {
      console.error('❌ [MAIN] Failed to initialize Gemini:', initError);
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize AI service',
          details: initError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    });

    console.log('🤖 [MAIN] Calling Gemini API...');
    
    let result;
    try {
      const startTime = Date.now();
      result = await model.generateContent([prompt, ...imageParts]);
      const processingTime = Date.now() - startTime;
      console.log(`✅ [MAIN] Gemini API completed in ${processingTime}ms`);
    } catch (geminiError) {
      console.error('❌ [MAIN] Gemini API call failed:', {
        name: geminiError.name,
        message: geminiError.message,
        stack: geminiError.stack,
        cause: geminiError.cause
      });
      
      return new Response(
        JSON.stringify({
          error: 'AI analysis failed',
          details: geminiError.message,
          errorType: geminiError.name
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const response = result.response;
    const textContent = response.text();
    
    console.log(`📄 [MAIN] Gemini returned ${textContent.length} characters`);
    console.log('📄 [MAIN] Response preview:', textContent.substring(0, 200) + '...');

    // Parse response
    let parsedResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
        console.log('✅ [MAIN] Successfully parsed JSON response');
      } else {
        // Fallback if no JSON found
        console.log('⚠️ [MAIN] No JSON found, creating fallback response');
        parsedResult = {
          description: textContent,
          condition: {
            summary: "Analysis completed",
            points: ["Assessment provided"],
            rating: "fair"
          },
          cleanliness: "domestic_clean"
        };
      }
    } catch (parseError) {
      console.error('❌ [MAIN] Failed to parse response:', parseError);
      // Create fallback response
      parsedResult = {
        description: textContent.substring(0, 500),
        condition: {
          summary: "Analysis completed with parsing issues",
          points: ["Raw analysis available"],
          rating: "fair"
        },
        cleanliness: "domestic_clean",
        rawResponse: textContent
      };
    }

    // Add metadata
    const finalResponse = {
      ...parsedResult,
      processingMetadata: {
        modelUsed: 'gemini-2.0-flash-exp',
        processingTime: Date.now(),
        imageCount: imageParts.length,
        unifiedSystem: true
      }
    };

    console.log('✅ [MAIN] Processing complete, returning response');
    
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [MAIN] Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        error: 'Unexpected server error',
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
