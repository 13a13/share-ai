import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Simple in-memory rate limiter per IP/UA
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ = 20; // 20 requests/minute

function getClientKey(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  return `${ip}:${ua}`;
}

function checkRateLimit(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQ - 1 };
  }
  if (entry.count >= MAX_REQ) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, remaining: MAX_REQ - entry.count };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Enforce JWT (platform also enforces via config)
  const auth = req.headers.get('authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  // Rate limit
  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageUrls, componentName, checkinData, maxSentences = 3 } = await req.json();

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided for analysis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const safeComponentName = (componentName || 'component').toString().slice(0, 100);
    const sanitizedUrls = imageUrls
      .map((u: unknown) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u: string) => u.startsWith('https://'))
      .slice(0, 8); // cap number of images

    if (sanitizedUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid HTTPS image URLs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert property inspector analyzing checkout images. Compare the current state with the check-in condition and identify any changes. Keep responses concise (max ${maxSentences} sentences each). Return JSON with: condition, conditionSummary, description, changesSinceCheckin.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analyze these checkout images of "${safeComponentName}". Original check-in condition: ${checkinData?.originalCondition || 'unknown'}. Original description: ${checkinData?.originalDescription || 'none'}. Identify changes/damage since check-in.` },
          ...sanitizedUrls.map((url: string) => ({ type: 'image_url', image_url: { url } })),
        ],
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 500, temperature: 0.1 }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `OpenAI API error: ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    } catch {
      const content = data.choices?.[0]?.message?.content ?? '';
      analysisResult = {
        condition: 'requires_review',
        conditionSummary: content.substring(0, 100),
        description: content,
        changesSinceCheckin: 'Manual review required - see description',
        images: sanitizedUrls,
      };
    }

    const result = {
      condition: analysisResult.condition || 'requires_review',
      conditionSummary: analysisResult.conditionSummary || 'Analysis completed',
      description: analysisResult.description || 'Image analysis completed',
      changesSinceCheckin: analysisResult.changesSinceCheckin || 'Changes detected',
      images: sanitizedUrls,
      checkinData,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in process-checkout-images function:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        condition: 'error',
        conditionSummary: 'Analysis failed',
        description: 'Image analysis temporarily unavailable. Please provide manual assessment.',
        changesSinceCheckin: 'Unable to determine changes automatically',
        images: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
