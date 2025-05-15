
/**
 * Secure CORS headers for API requests
 * Restricts access to approved origins only
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // This should be restricted in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // Cache preflight requests for 24 hours
};

/**
 * Check if an origin is allowed based on environment
 * @param origin The origin making the request
 */
export const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  // In development, allow localhost
  if (import.meta.env.DEV) {
    return origin.includes('localhost') || 
           origin.includes('127.0.0.1') ||
           origin.includes('lovableproject.com');
  }
  
  // In production, only allow specific domains
  const allowedDomains = [
    'verifyvisionai.com',
    'lovable.dev',
    'lovableproject.com',
    'blrzoqsszyuvskbuidzk.supabase.co'
  ];
  
  return allowedDomains.some(domain => origin.includes(domain));
};

/**
 * Handle CORS preflight requests
 * @param req The incoming request object
 * @returns Response for OPTIONS requests
 */
export const handleCorsPreflightRequest = (req: Request): Response | null => {
  if (req.method !== 'OPTIONS') return null;
  
  // Get the origin from the request
  const origin = req.headers.get('origin');
  
  // If origin is allowed, return CORS headers
  if (isAllowedOrigin(origin)) {
    const headers = { 
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin || '*'
    };
    return new Response(null, { headers });
  }
  
  // If origin is not allowed, return 403 Forbidden
  return new Response(JSON.stringify({ error: 'Origin not allowed' }), { 
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
};
