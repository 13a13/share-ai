
import { corsHeaders } from './cors.ts';

export function createErrorResponse(error: Error, status: number = 500): Response {
  console.error(`❌ [RESPONSE FORMATTER] Creating error response:`, {
    error: error.message,
    status,
    stack: error.stack
  });
  
  // Provide user-friendly error messages
  let userMessage = error.message;
  
  if (error.message.includes('Invalid API key')) {
    userMessage = 'Gemini API key is invalid. Please check your API key configuration in Supabase secrets.';
  } else if (error.message.includes('Rate limit exceeded')) {
    userMessage = 'AI service is temporarily busy. Please try again in a few minutes.';
  } else if (error.message.includes('timeout')) {
    userMessage = 'AI analysis is taking longer than expected. Please try with fewer or smaller images.';
  } else if (error.message.includes('content safety filters')) {
    userMessage = 'Image content was blocked by safety filters. Please try different images.';
  } else if (error.message.includes('Budget limit reached')) {
    userMessage = 'AI analysis budget limit reached. Please contact support to increase limits.';
  } else if (!error.message.toLowerCase().includes('gemini')) {
    userMessage = `Analysis failed: ${error.message}`;
  }
  
  return new Response(
    JSON.stringify({ 
      error: userMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    }),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

export function createValidationErrorResponse(message: string): Response {
  console.error(`❌ [RESPONSE FORMATTER] Validation error:`, message);
  
  return new Response(
    JSON.stringify({ 
      error: 'Invalid request',
      details: message,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 400, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}
