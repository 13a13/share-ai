
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, componentName, checkinData, maxSentences = 3 } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are an expert property inspector analyzing checkout images. Compare the current state with the check-in condition and identify any changes. Keep responses concise (max ${maxSentences} sentences each). Return JSON with: condition, conditionSummary, description, changesSinceCheckin.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these checkout images of "${componentName}". Original check-in condition: ${checkinData?.originalCondition || 'unknown'}. Original description: ${checkinData?.originalDescription || 'none'}. Identify any changes or damage since check-in.`
          },
          ...imageUrls.map((url: string) => ({
            type: 'image_url',
            image_url: { url }
          }))
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let analysisResult;

    try {
      // Try to parse as JSON first
      analysisResult = JSON.parse(data.choices[0].message.content);
    } catch {
      // If JSON parsing fails, create structured response
      const content = data.choices[0].message.content;
      analysisResult = {
        condition: 'requires_review',
        conditionSummary: content.substring(0, 100),
        description: content,
        changesSinceCheckin: 'Manual review required - see description',
        images: imageUrls
      };
    }

    // Ensure all required fields are present
    const result = {
      condition: analysisResult.condition || 'requires_review',
      conditionSummary: analysisResult.conditionSummary || 'Analysis completed',
      description: analysisResult.description || 'Image analysis completed',
      changesSinceCheckin: analysisResult.changesSinceCheckin || 'Changes detected',
      images: imageUrls,
      checkinData: checkinData
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-checkout-images function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      condition: 'error',
      conditionSummary: 'Analysis failed',
      description: 'Image analysis temporarily unavailable. Please provide manual assessment.',
      changesSinceCheckin: 'Unable to determine changes automatically',
      images: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
