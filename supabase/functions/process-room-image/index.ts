
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

import { corsHeaders } from '../_shared/cors.ts';
import { UnifiedResponseParser } from './unified-response-parser.ts';
import { UnifiedPromptManager } from './unified-prompt-manager.ts';

console.log('🚀 Unified Gemini System - Single Prompt Processing');

// Verify dependencies on startup
console.log('🔍 [STARTUP] Verifying dependencies...');
console.log('✅ [STARTUP] CORS headers imported successfully');
console.log('✅ [STARTUP] UnifiedResponseParser imported successfully');  
console.log('✅ [STARTUP] UnifiedPromptManager imported successfully');
console.log('🔑 [STARTUP] GEMINI_API_KEY available:', !!Deno.env.get('GEMINI_API_KEY'));

serve(async (req) => {
  console.log(`📡 [REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [CORS] Handling preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    console.log('🏥 [HEALTH CHECK] Function health check requested');
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dependencies: {
        corsHeaders: 'available',
        unifiedPromptManager: 'available',
        unifiedResponseParser: 'available',
        geminiApiKey: !!Deno.env.get('GEMINI_API_KEY')
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🔄 [MAIN] Starting Unified Gemini processing pipeline');

    const { imageUrls, componentName, roomType, unifiedSystem, imageCount } = await req.json();
    
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

    // Convert images to base64 for AI processing
    const base64Images = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`📥 [Multi-Image ${i + 1}/${imageUrls.length}] Fetching image from organized storage: ${imageUrl}`);
      
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const imageBuffer = await response.arrayBuffer();
        const base64String = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        base64Images.push({
          inlineData: {
            data: base64String,
            mimeType: response.headers.get('content-type') || 'image/jpeg'
          }
        });
        
        console.log(`✅ [Multi-Image ${i + 1}/${imageUrls.length}] Successfully converted organized image to base64 for AI processing`);
      } catch (error) {
        console.error(`❌ [Multi-Image ${i + 1}/${imageUrls.length}] Error processing image:`, error);
        continue;
      }
    }

    console.log(`📸 Successfully prepared ${base64Images.length}/${imageUrls.length} images for AI processing (multi-image support enabled)`);

    if (base64Images.length === 0) {
      throw new Error('No images could be processed for AI analysis');
    }

    // Initialize unified processing components
    const promptManager = new UnifiedPromptManager();
    const responseParser = new UnifiedResponseParser();

    console.log('🚀 [UNIFIED SYSTEM] Starting unified Gemini processing for', base64Images.length, 'images');

    // Generate unified prompt
    const context = {
      componentName,
      roomType,
      imageCount: base64Images.length,
      ...promptManager.getComponentContext(componentName)
    };

    const unifiedPrompt = promptManager.generateUnifiedPrompt(context);
    
    console.log('🚀 [UNIFIED AI] Starting unified processing for', base64Images.length, 'images');
    console.log('📊 [UNIFIED AI] Component:', componentName, 'Room:', roomType);
    console.log('📝 [UNIFIED AI] Generated unified prompt (', unifiedPrompt.length, 'chars)');

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    
    console.log('📝 [GEMINI API] Creating Gemini 2.0 Flash request for', base64Images.length, 'images');
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    });

    console.log('⚙️ [GEMINI API] Request configured for Gemini 2.0 Flash:', {
      imageCount: base64Images.length,
      originalImageCount: imageUrls.length,
      maxTokens: 4096,
      temperature: 0.2
    });

    console.log('🚀 [GEMINI API] Calling Gemini 2.0 Flash exclusively');
    
    const result = await model.generateContent([
      unifiedPrompt,
      ...base64Images
    ]);

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
    console.error('❌ [ERROR DETAILS] Stack trace:', error.stack);
    console.error('❌ [ERROR TYPE]:', error.name);
    console.error('❌ [ERROR MESSAGE]:', error.message);
    
    // Log additional context for debugging
    console.log('🔍 [DEBUG] Request data during error:', {
      hasImageUrls: !!(req.body),
      timestamp: new Date().toISOString(),
      errorOccurredAt: Date.now()
    });
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        fallback: {
          description: 'Analysis could not be completed due to technical issue',
          condition: { 
            summary: 'Manual assessment required - Technical analysis failed', 
            points: ['Unable to process images automatically', 'Manual inspection recommended'], 
            rating: 'fair' 
          },
          cleanliness: 'domestic_clean',
          analysisMetadata: {
            processingComplete: false,
            errorOccurred: true,
            errorMessage: error.message
          }
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
