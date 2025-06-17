
import { corsHeaders } from './cors.ts';
import { processAndOrganizeImages } from './image-processor.ts';
import { AIProcessor } from './ai-processor.ts';
import type { AIProcessingOptions } from './ai-processing-options.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

Deno.serve(async (req) => {
  console.log('🚀 Advanced Defect Detection System - Gemini 2.0 Flash');

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
      inventoryMode: requestData.inventoryMode,
      useAdvancedAnalysis: requestData.useAdvancedAnalysis
    });

    console.log('🔄 [MAIN] Starting Advanced Defect Detection pipeline');

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
    } else {
      throw new Error('No images or imageIds provided');
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

    // Setup AI processing options
    const aiOptions: AIProcessingOptions = {
      componentName: requestData.componentName || 'Room',
      roomType: requestData.roomType || 'general',
      inventoryMode: requestData.inventoryMode || false,
      useAdvancedAnalysis: requestData.useAdvancedAnalysis || (imageUrls.length > 1),
      imageCount: imageUrls.length,
      originalImageCount: imageUrls.length
    };

    // Initialize AI processor
    const aiProcessor = new AIProcessor();

    console.log('🚀 [ADVANCED AI] Starting Gemini 2.0 Flash processing for', processedImages.length, 'images');

    // Process with enhanced AI
    const aiResult = await aiProcessor.processImagesWithEnhancedAI(
      processedImages,
      aiOptions,
      GEMINI_API_KEY
    );

    console.log('✅ [MAIN] Advanced processing complete:', {
      modelUsed: aiResult.modelUsed,
      processingTime: aiResult.processingTime,
      parsingMethod: 'enhanced_ai_processor',
      confidence: 0.9,
      validationApplied: !!aiResult.validationResult
    });

    // Format response for room processing
    if (requestData.imageIds) {
      console.log('📋 [RESPONSE FORMATTER] Creating enhanced room response');
      
      const response = {
        room: {
          id: requestData.roomId,
          description: aiResult.parsedData.description || '',
          condition: aiResult.parsedData.condition || { summary: '', points: [], rating: 'fair' },
          cleanliness: aiResult.parsedData.cleanliness || 'domestic_clean',
          analysis: {
            modelUsed: aiResult.modelUsed,
            processingTime: `${aiResult.processingTime}ms`,
            imageCount: imageUrls.length,
            multiImageAnalysis: aiResult.shouldUseAdvancedAnalysis,
            confidence: aiResult.validationResult?.confidence || 0.9
          }
        },
        organizedImageUrls,
        propertyRoomInfo,
        costIncurred: aiResult.costIncurred,
        processingMetadata: {
          processingTime: aiResult.processingTime,
          method: 'enhanced_ai_processor',
          modelUsed: aiResult.modelUsed,
          multiImageAnalysis: aiResult.shouldUseAdvancedAnalysis
        }
      };

      console.log('💰 [RESPONSE FORMATTER] Enhanced metadata added: processing time:', `${aiResult.processingTime}ms`, ', method: enhanced_ai_processor');
      console.log('✅ [RESPONSE FORMATTER] Advanced Defect Detection processing complete');

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format response for component processing
    console.log('📋 [RESPONSE FORMATTER] Creating enhanced component response');
    
    const componentResponse = {
      ...aiResult.parsedData,
      organizedImageUrls,
      propertyRoomInfo,
      costIncurred: aiResult.costIncurred,
      processingMetadata: {
        processingTime: aiResult.processingTime,
        method: 'enhanced_ai_processor',
        modelUsed: aiResult.modelUsed,
        multiImageAnalysis: aiResult.shouldUseAdvancedAnalysis
      }
    };

    console.log('✅ [RESPONSE FORMATTER] Enhanced component processing complete');

    return new Response(JSON.stringify(componentResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [MAIN] Processing failed:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Processing failed',
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
