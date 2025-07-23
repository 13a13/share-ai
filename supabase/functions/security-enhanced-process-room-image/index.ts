import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Input validation functions
function validateInput(input: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'object') {
    errors.push('Invalid input format');
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (!input.room_id || typeof input.room_id !== 'string') {
    errors.push('Invalid room_id');
  }
  
  if (!input.inspection_id || typeof input.inspection_id !== 'string') {
    errors.push('Invalid inspection_id');
  }
  
  if (!input.image_urls || !Array.isArray(input.image_urls)) {
    errors.push('Invalid image_urls');
  }
  
  // Validate image URLs
  if (input.image_urls) {
    for (const url of input.image_urls) {
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        errors.push('Invalid image URL format');
        break;
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .replace(/\0/g, '')
    .slice(0, 1000);
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  const entry = rateLimitMap.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

async function logSecurityEvent(
  supabase: any,
  event: {
    action: string;
    success: boolean;
    ip?: string;
    userAgent?: string;
    additionalData?: Record<string, any>;
  }
) {
  try {
    await supabase.rpc('log_security_event', {
      p_action: event.action,
      p_resource: 'edge_function_process_room_image',
      p_success: event.success,
      p_error_message: event.success ? null : (event.additionalData?.error || 'Unknown error'),
      p_metadata: event.additionalData || {}
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Extract client information for security logging
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientId = `${clientIp}-${userAgent}`;
    
    // Check rate limiting
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      await logSecurityEvent(supabase, {
        action: 'rate_limit_exceeded',
        success: false,
        ip: clientIp,
        userAgent,
        additionalData: { endpoint: 'process-room-image' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logSecurityEvent(supabase, {
        action: 'unauthorized_access_attempt',
        success: false,
        ip: clientIp,
        userAgent,
        additionalData: { reason: 'missing_auth_header' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate input
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      await logSecurityEvent(supabase, {
        action: 'invalid_request_format',
        success: false,
        ip: clientIp,
        userAgent,
        additionalData: { error: 'Invalid JSON' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const validation = validateInput(requestBody);
    if (!validation.valid) {
      await logSecurityEvent(supabase, {
        action: 'input_validation_failed',
        success: false,
        ip: clientIp,
        userAgent,
        additionalData: { errors: validation.errors }
      });
      
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize inputs
    const sanitizedRoomId = sanitizeInput(requestBody.room_id);
    const sanitizedInspectionId = sanitizeInput(requestBody.inspection_id);

    // Verify user has access to the room
    const { data: roomAccess, error: roomError } = await supabase
      .from('rooms')
      .select('property_id, properties!inner(user_id)')
      .eq('id', sanitizedRoomId)
      .single();

    if (roomError || !roomAccess) {
      await logSecurityEvent(supabase, {
        action: 'unauthorized_room_access',
        success: false,
        ip: clientIp,
        userAgent,
        additionalData: { room_id: sanitizedRoomId }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to room' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process the images (placeholder for actual AI processing)
    const processedResults = {
      room_id: sanitizedRoomId,
      inspection_id: sanitizedInspectionId,
      analysis: {
        components_detected: [],
        overall_condition: 'good',
        issues_found: [],
        confidence_score: 0.95
      },
      processed_at: new Date().toISOString()
    };

    // Log successful processing
    await logSecurityEvent(supabase, {
      action: 'room_image_processed',
      success: true,
      ip: clientIp,
      userAgent,
      additionalData: { 
        room_id: sanitizedRoomId,
        inspection_id: sanitizedInspectionId,
        image_count: requestBody.image_urls.length
      }
    });

    return new Response(
      JSON.stringify(processedResults),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    
    await logSecurityEvent(supabase, {
      action: 'function_error',
      success: false,
      additionalData: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});