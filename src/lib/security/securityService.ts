
import { rateLimiter } from './rateLimiter';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  remainingAttempts?: number;
  resetTime?: number;
}

class SecurityService {
  private suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /onload/i,
    /onerror/i,
    /<.*>/,
    /\.\./,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /update.*set/i,
    /delete.*from/i
  ];

  public sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\0/g, '') // Remove null bytes
      .slice(0, 1000); // Limit length
  }

  public validateEmail(email: string): { valid: boolean; reason?: string } {
    const sanitized = this.sanitizeInput(email);
    
    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return { valid: false, reason: 'Invalid email format' };
      }
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitized)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check for suspicious domains
    const suspiciousDomains = ['tempmail', '10minutemail', 'guerrillamail', 'mailinator'];
    const domain = sanitized.split('@')[1]?.toLowerCase();
    if (domain && suspiciousDomains.some(sus => domain.includes(sus))) {
      return { valid: false, reason: 'Temporary email addresses are not allowed' };
    }

    return { valid: true };
  }

  public checkRateLimit(action: string, identifier?: string): SecurityCheckResult {
    const result = rateLimiter.checkLimit(action, identifier);
    
    if (!result.allowed) {
      const remainingTime = rateLimiter.getRemainingTime(action, identifier);
      const minutes = Math.ceil(remainingTime / 60000);
      
      return {
        allowed: false,
        reason: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        remainingAttempts: result.remainingAttempts,
        resetTime: result.resetTime
      };
    }

    return { allowed: true, remainingAttempts: result.remainingAttempts };
  }

  public recordAttempt(action: string, identifier?: string, success: boolean = false): void {
    rateLimiter.recordAttempt(action, identifier, success);
  }

  public generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  public validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, you'd store and validate against server-side tokens
    // For now, we'll do client-side validation as a baseline
    return token && sessionToken && token.length === 64;
  }

  public detectSuspiciousActivity(events: Array<{ action: string; timestamp: number; success: boolean }>): boolean {
    if (events.length < 5) return false;

    const recentEvents = events.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000); // Last 5 minutes
    const failureRate = recentEvents.filter(e => !e.success).length / recentEvents.length;
    
    // Flag if more than 80% failures in recent activity
    return failureRate > 0.8;
  }

  public async logSecurityEvent(event: {
    action: string;
    success: boolean;
    identifier?: string;
    userAgent?: string;
    ip?: string;
    resource?: string;
    additionalData?: Record<string, any>;
  }): Promise<void> {
    // Log to console for debugging
    console.log('[SECURITY]', {
      timestamp: new Date().toISOString(),
      ...event
    });

    // Also log to database for audit trail
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.rpc('log_security_event', {
          p_action: event.action,
          p_resource: event.resource || null,
          p_success: event.success,
          p_error_message: event.success ? null : (event.additionalData?.error || 'Unknown error'),
          p_metadata: event.additionalData || {}
        });
      }
    } catch (error) {
      console.warn('Failed to log security event to database:', error);
    }
  }

  public async getSecurityLogs(limit: number = 50): Promise<any[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
      return [];
    }
  }
}

export const securityService = new SecurityService();
