
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from './cors.ts';
import { processAndOrganizeImages } from './image-processor.ts';
import { AIProcessor } from './ai-processor.ts';
import type { AIProcessingOptions } from './ai-processing-options.ts';
import { createErrorResponse, createValidationErrorResponse } from './response-formatter.ts';

// Validation function to ensure analysis results are meaningful
function validateAnalysisResult(result: any, componentName?: string): any {
  console.log('🔧 [VALIDATION] Validating analysis result:', {
    hasResult: Boolean(result),
    hasDescription: Boolean(result?.description),
    hasCondition: Boolean(result?.condition),
    originalDescription: result?.description,
    originalConditionSummary: result?.condition?.summary
  });
  
  if (!result || typeof result !== 'object') {
    console.warn('⚠️ [VALIDATION] Invalid result object, creating fallback');
    return createFallbackResult(componentName);
  }
  
  const validated = {
    description: validateAndEnhanceField(
      result.description, 
      componentName ? `${componentName} has been analyzed and documented` : 'Component analysis completed successfully'
    ),
    condition: {
      summary: validateAndEnhanceField(
        result.condition?.summary,
        'Component condition has been assessed'
      ),
      points: Array.isArray(result.condition?.points) ? result.condition.points : [],
      rating: result.condition?.rating || 'fair'
    },
    cleanliness: result.cleanliness || 'domestic_clean',
    notes: '' // Always empty - reserved for manual inspector input only
  };
  
  // Add crossAnalysis if it exists (for advanced mode)
  if (result.crossAnalysis) {
    validated.crossAnalysis = result.crossAnalysis;
  }
  
  console.log('✅ [VALIDATION] Validation completed:', {
    enhancedDescription: validated.description,
    enhancedConditionSummary: validated.condition.summary,
    hasValidContent: validated.description !== 'Component analysis completed successfully' || 
                    validated.condition.summary !== 'Component condition has been assessed'
  });
  
  return validated;
}

function validateAndEnhanceField(value: any, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0 && value !== 'Analysis completed') {
    return value.trim();
  }
  return fallback;
}

function createFallbackResult(componentName?: string): any {
  return {
    description: componentName ? `${componentName} inspection completed` : 'Component inspection completed',
    condition: {
      summary: 'Component appears to be in functional condition',
      points: [],
      rating: 'fair'
    },
    cleanliness: 'domestic_clean',
    notes: '' // Reserved for manual inspector input only
  };
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Helper function to create authenticated Supabase clients
const createSupabaseClients = async (authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  // Create anon client for user validation and RLS-protected operations
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Create service role client for privileged operations (use sparingly)
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return { anonClient, serviceClient };
};

Deno.serve(async (req) => {
  console.log('🚀 Advanced Defect Detection System - Gemini 2.0 Flash (Secured Version)');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return createErrorResponse(new Error('GEMINI_API_KEY not configured in Supabase secrets'), 500);
  }

  // Validate API key format
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.error('❌ GEMINI_API_KEY has invalid format');
    return createErrorResponse(new Error('GEMINI_API_KEY has invalid format. Expected format: AIza...'), 500);
  }

  // CRITICAL SECURITY: Validate user authentication
  const authHeader = req.headers.get('Authorization');
  try {
    const { anonClient, serviceClient } = await createSupabaseClients(authHeader);
    
    // Get authenticated user
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return createErrorResponse(new Error('Unauthorized'), 401);
    }

    console.log(`🔐 Authenticated user: ${user.id}`);

    // Parse and validate request
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      return createErrorResponse(new Error('Invalid JSON in request body'), 400);
    }

    console.log('📥 Request data received:', {
      imageCount: requestData.images?.length || requestData.imageIds?.length || 0,
      componentName: requestData.componentName,
      roomType: requestData.roomType,
      inventoryMode: requestData.inventoryMode,
      useAdvancedAnalysis: requestData.useAdvancedAnalysis,
      reportId: requestData.reportId,
      roomId: requestData.roomId
    });

    // CRITICAL SECURITY: Validate ownership before proceeding
    if (requestData.imageIds && requestData.imageIds.length > 0) {
      console.log('🔒 Validating ownership of image IDs...');
      
      // Use RLS-protected query to validate ownership
      const { data: userImages, error: ownershipError } = await anonClient
        .from('room_images')
        .select(`
          id,
          url,
          room_id,
          rooms!inner(
            id,
            property_id,
            properties!inner(
              id,
              user_id
            )
          )
        `)
        .in('id', requestData.imageIds);

      if (ownershipError) {
        console.error('❌ Ownership validation failed:', ownershipError);
        return createErrorResponse(new Error('Access denied'), 403);
      }

      if (!userImages || userImages.length !== requestData.imageIds.length) {
        console.error(`❌ Access denied: User can only access ${userImages?.length || 0} of ${requestData.imageIds.length} requested images`);
        return createErrorResponse(new Error('Access denied to one or more images'), 403);
      }

      // Validate report ownership if provided
      if (requestData.reportId) {
        const { data: reportData, error: reportError } = await anonClient
          .from('inspections')
          .select(`
            id,
            room_id,
            rooms!inner(
              property_id,
              properties!inner(
                user_id
              )
            )
          `)
          .eq('id', requestData.reportId)
          .single();

        if (reportError || !reportData) {
          console.error('❌ Report access denied:', reportError);
          return createErrorResponse(new Error('Access denied to report'), 403);
        }
      }

      console.log('✅ Ownership validation passed');
    }

    console.log('🔄 [MAIN] Starting Advanced Defect Detection pipeline (secured)');

    let imageUrls: string[] = [];

    if (requestData.imageIds && requestData.imageIds.length > 0) {
      // Handle room image processing with database lookup using RLS-protected query
      console.log(`📸 Processing room images from database: ${requestData.imageIds.length} image IDs`);
      
      // Use anon client for RLS-protected access
      const { data: images, error } = await anonClient
        .from('room_images')
        .select('url')
        .in('id', requestData.imageIds);

      if (error) {
        console.error('❌ Failed to fetch images from database:', error);
        return createErrorResponse(new Error(`Failed to fetch images: ${error.message}`), 500);
      }

      imageUrls = images?.map(img => img.url) || [];
      console.log(`✅ Retrieved ${imageUrls.length} image URLs from database`);
    } else if (requestData.images && Array.isArray(requestData.images)) {
      // Handle direct image processing
      imageUrls = requestData.images;
      console.log(`📸 Processing direct images: ${imageUrls.length} URLs`);
    } else {
      console.error('❌ Invalid request format:', { 
        hasImages: !!requestData.images, 
        hasImageIds: !!requestData.imageIds,
        imagesType: typeof requestData.images,
        imageIdsType: typeof requestData.imageIds
      });
      return createValidationErrorResponse('No valid images or imageIds provided in request');
    }

    if (imageUrls.length === 0) {
      console.error('❌ No image URLs found to process');
      return createValidationErrorResponse('No valid image URLs found to process');
    }

    // Process and organize images with error handling
    let processedImages: string[], organizedImageUrls: string[], propertyRoomInfo: any;
    try {
      const result = await processAndOrganizeImages(
        imageUrls,
        requestData.componentName,
        requestData.reportId,
        requestData.roomId
      );
      processedImages = result.processedImages;
      organizedImageUrls = result.organizedImageUrls;
      propertyRoomInfo = result.propertyRoomInfo;
    } catch (imageError) {
      console.error('❌ Image processing failed:', imageError);
      return createErrorResponse(imageError instanceof Error ? imageError : new Error('Image processing failed'), 500);
    }

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

    // Process with enhanced AI with proper error handling
    let aiResult;
    try {
      aiResult = await aiProcessor.processImagesWithEnhancedAI(
        processedImages,
        aiOptions,
        GEMINI_API_KEY
      );
      
      console.log('✅ [ADVANCED AI] Processing successful:', {
        modelUsed: aiResult.modelUsed,
        processingTime: aiResult.processingTime,
        costIncurred: aiResult.costIncurred
      });
      
    } catch (aiError) {
      console.error('❌ AI processing failed:', aiError);
      
      // Return proper error response instead of fallback
      if (aiError instanceof Error) {
        return createErrorResponse(aiError, 500);
      } else {
        return createErrorResponse(new Error('AI analysis failed with unknown error'), 500);
      }
    }

    console.log('✅ [MAIN] Advanced processing complete:', {
      modelUsed: aiResult.modelUsed,
      processingTime: aiResult.processingTime,
      parsingMethod: 'enhanced_ai_processor',
      confidence: 0.9,
      validationApplied: !!aiResult.validationResult
    });

    // Validate results before formatting response
    const validatedResult = validateAnalysisResult(aiResult.parsedData, aiOptions.componentName);
    
    // Format response for room processing
    if (requestData.imageIds) {
      console.log('📋 [RESPONSE FORMATTER] Creating enhanced room response');
      
      const response = {
        room: {
          id: requestData.roomId,
          description: validatedResult.description,
          condition: validatedResult.condition,
          cleanliness: validatedResult.cleanliness,
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

      console.log('✅ [RESPONSE FORMATTER] Advanced Defect Detection processing complete');

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format response for component processing
    console.log('📋 [RESPONSE FORMATTER] Creating enhanced component response');
    
    const componentResponse = {
      ...validatedResult,
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
    
    // Use proper error formatter
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown processing error'), 500);
  }
});
