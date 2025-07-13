
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// CORS headers for web app integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { UnifiedResponseParser } from './unified-response-parser.ts';
import { UnifiedPromptManager } from './unified-prompt-manager.ts';

console.log('🚀 Unified Gemini System - Single Prompt Processing');

serve(async (req) => {
  console.log('🚀 [MAIN] Edge function called - basic check');
  
  if (req.method === 'OPTIONS') {
    console.log('🚀 [MAIN] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Add a simple health check endpoint
  if (req.url.includes('health')) {
    console.log('🚀 [MAIN] Health check requested');
    return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('🔄 [MAIN] Starting Unified Gemini processing pipeline');
    console.log('🔄 [MAIN] Request method:', req.method);
    console.log('🔄 [MAIN] Request headers:', Object.fromEntries(req.headers.entries()));

    let requestData;
    try {
      requestData = await req.json();
      console.log('📥 [MAIN] Successfully parsed request JSON');
    } catch (jsonError) {
      console.error('❌ [MAIN] Failed to parse request JSON:', jsonError);
      throw new Error(`Invalid JSON in request: ${jsonError.message}`);
    }

    const { imageUrls, componentName, roomType, unifiedSystem, imageCount } = requestData;
    
    console.log('📥 Request data received:', {
      imageCount: imageUrls?.length || 0,
      componentName,
      roomType,
      unifiedSystem
    });

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('No image URLs provided');
    }

    console.log('📸 Processing imageUrls:', imageUrls.length, 'URLs');

    // Process images through unified system
    const startTime = Date.now();
    
    // Process multi-photo analysis
    console.log(`📸 Processing ${componentName} with ${imageUrls.length} images for multi-photo analysis`);

    // Prepare images for Gemini (direct URLs for efficiency)
    const imageParts = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`🖼️ [Image ${i + 1}/${imageUrls.length}] Adding image: ${imageUrl.substring(0, 100)}...`);
      
      try {
        // Check if this is a base64 data URL
        if (imageUrl.startsWith('data:image/')) {
          console.log(`📋 [Image ${i + 1}/${imageUrls.length}] Processing base64 data URL`);
          const [header, base64Data] = imageUrl.split(',');
          const mimeMatch = header.match(/data:([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          
          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
          console.log(`✅ [Image ${i + 1}/${imageUrls.length}] Successfully processed base64 data URL`);
        } else {
          console.log(`🔗 [Image ${i + 1}/${imageUrls.length}] Using direct URL (no fetching needed)`);
          // Use direct URL - Gemini will handle the fetch
          imageParts.push({
            fileData: {
              fileUri: imageUrl,
              mimeType: 'image/jpeg'
            }
          });
          console.log(`✅ [Image ${i + 1}/${imageUrls.length}] Successfully added direct URL`);
        }
      } catch (error) {
        console.error(`❌ [Image ${i + 1}/${imageUrls.length}] Error processing image:`, error);
        continue;
      }
    }

    console.log(`🖼️ Successfully prepared ${imageParts.length}/${imageUrls.length} images for Gemini (direct URL support)`);

    if (imageParts.length === 0) {
      throw new Error('No images could be processed for AI analysis');
    }

    // Initialize unified processing components
    const promptManager = new UnifiedPromptManager();
    const responseParser = new UnifiedResponseParser();

    console.log('🚀 [UNIFIED SYSTEM] Starting unified Gemini processing for', imageParts.length, 'images');

    // Generate unified prompt
    const context = {
      componentName,
      roomType,
      imageCount: imageParts.length,
      ...promptManager.getComponentContext(componentName)
    };

    const unifiedPrompt = promptManager.generateUnifiedPrompt(context);
    
    console.log('🚀 [UNIFIED AI] Starting unified processing for', imageParts.length, 'images');
    console.log('📊 [UNIFIED AI] Component:', componentName, 'Room:', roomType);
    console.log('📝 [UNIFIED AI] Generated unified prompt (', unifiedPrompt.length, 'chars)');

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('❌ [GEMINI API] GEMINI_API_KEY environment variable not found');
      throw new Error('GEMINI_API_KEY environment variable not configured');
    }
    
    console.log('🔑 [GEMINI API] API key found, length:', geminiApiKey.length);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    console.log('📝 [GEMINI API] Creating Gemini 2.0 Flash request for', imageParts.length, 'images');
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    });

    console.log('⚙️ [GEMINI API] Request configured for Gemini 2.0 Flash:', {
      imageCount: imageParts.length,
      originalImageCount: imageUrls.length,
      maxTokens: 4096,
      temperature: 0.2
    });

    console.log('🚀 [GEMINI API] Calling Gemini 2.0 Flash exclusively');
    
    let result;
    try {
      result = await model.generateContent([
        unifiedPrompt,
        ...imageParts
      ]);
    } catch (geminiError) {
      console.error('❌ [GEMINI API] Gemini API call failed:', geminiError);
      console.error('❌ [GEMINI API] Error details:', {
        name: geminiError.name,
        message: geminiError.message,
        stack: geminiError.stack
      });
      throw new Error(`Gemini API error: ${geminiError.message}`);
    }

    const response = result.response;
    const textContent = response.text();
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ [GEMINI API] Gemini 2.0 Flash returned ${textContent.length} characters`);
    console.log(`⚡ [UNIFIED AI] Gemini 2.0 Flash completed in ${processingTime}ms`);

    // Parse response using enhanced parser
    const parsedResult = responseParser.parseUnifiedResponse(textContent, processingTime);
    
    console.log('✅ [UNIFIED AI] Unified processing complete:', {
      parsingMethod: parsedResult.processingMetadata.parsingMethod,
      confidence: parsedResult.processingMetadata.confidence,
      imageCount: parsedResult.analysisMetadata.imageCount,
      isConsistent: parsedResult.analysisMetadata.multiImageAnalysis.isConsistent
    });

    console.log('✅ [UNIFIED SYSTEM] Processing complete:', {
      modelUsed: parsedResult.processingMetadata.modelUsed,
      processingTime: parsedResult.processingMetadata.processingTime,
      parsingMethod: parsedResult.processingMetadata.parsingMethod,
      confidence: parsedResult.processingMetadata.confidence
    });

    // Format final response
    console.log('📋 [RESPONSE FORMATTER] Creating unified component response');
    
    const finalResponse = {
      description: parsedResult.description,
      condition: parsedResult.condition,
      cleanliness: parsedResult.cleanliness,
      analysisMetadata: parsedResult.analysisMetadata,
      processingMetadata: {
        ...parsedResult.processingMetadata,
        unifiedSystem: true,
        enhancedProcessing: true
      },
      components: parsedResult.components || []
    };

    console.log('✅ [RESPONSE FORMATTER] Unified component processing complete');

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [UNIFIED SYSTEM] Error in unified processing:', error);
    console.error('❌ [UNIFIED SYSTEM] Error stack:', error?.stack);
    console.error('❌ [UNIFIED SYSTEM] Error name:', error?.name);
    console.error('❌ [UNIFIED SYSTEM] Error message:', error?.message);
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        details: error.message,
        errorType: error.name || 'UnknownError',
        fallback: {
          description: 'Analysis could not be completed',
          condition: { summary: 'Manual assessment required', points: [], rating: 'fair' },
          cleanliness: 'domestic_clean'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
