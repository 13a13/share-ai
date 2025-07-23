// Security Headers Configuration
export const SECURITY_HEADERS = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https: http:;
    connect-src 'self' https://*.supabase.co https://blrzoqsszyuvskbuidzk.supabase.co https://generativelanguage.googleapis.com;
    frame-src 'self' https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

export const CORS_CONFIG = {
  origin: [
    'https://blrzoqsszyuvskbuidzk.supabase.co',
    'https://share-ai.lovable.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
  ].filter(Boolean) as string[],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Client-Info',
    'ApiKey'
  ]
};

export class SecurityHeadersManager {
  public static applyHeaders(): void {
    // Apply CSP via meta tag if not already set
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = SECURITY_HEADERS['Content-Security-Policy'];
      document.head.appendChild(cspMeta);
    }

    // Apply X-Frame-Options via meta tag
    if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
      const frameMeta = document.createElement('meta');
      frameMeta.httpEquiv = 'X-Frame-Options';
      frameMeta.content = SECURITY_HEADERS['X-Frame-Options'];
      document.head.appendChild(frameMeta);
    }

    // Log security headers applied
    console.log('[SECURITY] Security headers applied');
  }

  public static validateCORS(origin: string): boolean {
    return CORS_CONFIG.origin.includes(origin) || 
           (process.env.NODE_ENV === 'development' && origin.includes('localhost'));
  }
}