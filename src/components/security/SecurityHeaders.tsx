
import { Helmet } from 'react-helmet';

/**
 * SecurityHeaders component adds essential security headers via meta tags
 * This helps protect against common web vulnerabilities like XSS, clickjacking, etc.
 */
const SecurityHeaders = () => {
  // Generate a random nonce for CSP
  const nonce = Math.random().toString(36).substring(2);
  
  // Define the base URL for the application
  const baseUrl = window.location.origin;
  const supabaseUrl = "https://blrzoqsszyuvskbuidzk.supabase.co";
  
  return (
    <Helmet>
      {/* Force HTTPS */}
      {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
        <meta httpEquiv="refresh" content={`0;url=https://${window.location.host}${window.location.pathname}${window.location.search}`} />
      )}
      
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={`
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' https://cdn.gpteng.co https://*.supabase.co;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob: https://*.supabase.co;
        connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co;
        font-src 'self';
        object-src 'none';
        frame-src 'self';
        upgrade-insecure-requests;
      `} />
      
      {/* X-Content-Type-Options */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* X-Frame-Options */}
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      
      {/* Referrer-Policy */}
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Permissions-Policy */}
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(self)" />
    </Helmet>
  );
};

export default SecurityHeaders;
