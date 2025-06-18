
import { corsHeaders } from './cors.ts';
import { processAndOrganizeImages } from './image-processor.ts';
import { UnifiedAIProcessor } from './unified-ai-processor.ts';
import type { AIProcessingOptions } from './ai-processing-options.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

Deno.serve(async (req) => {
  console.log('🚀 Unified Gemini System - Single Prompt Processing');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const requestData = await req.json();
    console.log('📥 Request data received:', {
      imageCount: requestData.images?.length || requestData.imageIds?.length || 0,
      componentName: requestData.componentName,
      roomType: requestData.roomType,
      unifiedSystem: requestData.unifiedSystem
    });

    console.log('🔄 [MAIN] Starting Unified Gemini processing pipeline');

    let imageUrls: string[] = [];

    if (requestData.imageIds && requestData.imageIds.length > 0) {
      // Handle room image processing with database lookup
      console.log(`📸 Processing room images from database: ${requestData.imageIds.length} image IDs`);
      
      // Import Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch image URLs from database
      const { data: images, error } = await supabase
        .from('room_images')
        .select('url')
        .in('id', requestData.imageIds);

      if (error) {
        console.error('❌ Failed to fetch images from database:', error);
        throw new Error(`Failed to fetch images: ${error.message}`);
      }

      imageUrls = images?.map(img => img.url) || [];
      console.log(`✅ Retrieved ${imageUrls.length} image URLs from database`);
    } else if (requestData.images) {
      // Handle direct image processing
      imageUrls = requestData.images;
      console.log(`📸 Processing direct images: ${imageUrls.length} URLs`);
    } else if (requestData.imageUrls) {
      // Handle imageUrls field for compatibility
      imageUrls = requestData.imageUrls;
      console.log(`📸 Processing imageUrls: ${imageUrls.length} URLs`);
    } else {
      throw new Error('No images, imageUrls, or imageIds provided');
    }

    if (imageUrls.length === 0) {
      throw new Error('No image URLs found to process');
    }

    // Process and organize images
    const { processedImages, organizedImageUrls, propertyRoomInfo } = await processAndOrganizeImages(
      imageUrls,
      requestData.componentName,
      requestData.reportId,
      requestData.roomId
    );

    // Initialize unified AI processor
    const unifiedAIProcessor = new UnifiedAIProcessor();

    console.log('🚀 [UNIFIED SYSTEM] Starting unified Gemini processing for', processedImages.length, 'images');

    // Process with unified system
    const unifiedResult = await unifiedAIProcessor.processWithUnifiedSystem(
      processedImages,
      requestData.componentName || 'Component',
      requestData.roomType || 'room',
      GEMINI_API_KEY
    );

    console.log('✅ [UNIFIED SYSTEM] Processing complete:', {
      modelUsed: unifiedResult.processingMetadata.modelUsed,
      processingTime: unifiedResult.processingMetadata.processingTime,
      parsingMethod: unifiedResult.processingMetadata.parsingMethod,
      confidence: unifiedResult.processingMetadata.confidence
    });

    // Format response for frontend compatibility
    const compatibleResponse = {
      description: unifiedResult.description,
      condition: unifiedResult.condition,
      cleanliness: unifiedResult.cleanliness,
      processingMetadata: {
        ...unifiedResult.processingMetadata,
        enhancedProcessing: true,
        unifiedSystem: true
      },
      analysisMetadata: unifiedResult.analysisMetadata,
      organizedImageUrls,
      propertyRoomInfo,
      costIncurred: 0.1 // Estimated cost for Gemini 2.0 Flash
    };

    // Format response for room processing
    if (requestData.imageIds) {
      console.log('📋 [RESPONSE FORMATTER] Creating unified room response');
      
      const response = {
        room: {
          id: requestData.roomId,
          description: unifiedResult.description || '',
          condition: unifiedResult.condition || { summary: '', points: [], rating: 'fair' },
          cleanliness: unifiedResult.cleanliness || 'domestic_clean',
          analysis: {
            modelUsed: unifiedResult.processingMetadata.modelUsed,
            processingTime: `${unifiedResult.processingMetadata.processingTime}ms`,
            imageCount: imageUrls.length,
            unifiedSystem: true,
            confidence: unifiedResult.processingMetadata.confidence
          }
        },
        organizedImageUrls,
        propertyRoomInfo,
        costIncurred: compatibleResponse.costIncurred,
        processingMetadata: {
          processingTime: unifiedResult.processingMetadata.processingTime,
          method: 'unified_system',
          modelUsed: unifiedResult.processingMetadata.modelUsed,
          unifiedSystem: true
        }
      };

      console.log('💰 [RESPONSE FORMATTER] Unified metadata added: processing time:', `${unifiedResult.processingMetadata.processingTime}ms`, ', method: unified_system');
      console.log('✅ [RESPONSE FORMATTER] Unified processing complete');

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format response for component processing
    console.log('📋 [RESPONSE FORMATTER] Creating unified component response');

    console.log('✅ [RESPONSE FORMATTER] Unified component processing complete');

    return new Response(JSON.stringify(compatibleResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [MAIN] Unified processing failed:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unified processing failed',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
