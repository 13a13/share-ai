import { supabase } from "@/integrations/supabase/client";
import { securityService } from './securityService';

export interface SessionFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
}

export interface SessionInfo {
  id: string;
  fingerprint: SessionFingerprint;
  lastActivity: number;
  expiresAt: number;
  isActive: boolean;
}

class SessionManager {
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private checkInterval = 60 * 1000; // Check every minute
  private intervalId: NodeJS.Timeout | null = null;
  private initializing = false;

  public generateFingerprint(): SessionFingerprint {
    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    };
  }

  public hashFingerprint(fingerprint: SessionFingerprint): string {
    const combined = Object.values(fingerprint).join('|');
    // Simple hash function for client-side use
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public async initializeSession(): Promise<void> {
    if (this.initializing) return;
    this.initializing = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { this.initializing = false; return; }

      const fingerprint = this.generateFingerprint();
      const fingerprintHash = this.hashFingerprint(fingerprint);

      // Upsert session to avoid duplicate key errors on session_token
      await supabase.from('user_sessions').upsert({
        user_id: session.user.id,
        session_token: session.access_token,
        fingerprint: fingerprintHash,
        user_agent: navigator.userAgent,
        is_active: true,
        expires_at: new Date(Date.now() + this.sessionTimeout).toISOString(),
        last_activity: new Date().toISOString()
      }, { onConflict: 'session_token' });

      // Store fingerprint locally for validation
      localStorage.setItem('session_fingerprint', fingerprintHash);
      localStorage.setItem('session_last_activity', Date.now().toString());

      // Start session monitoring
      this.startSessionMonitoring();
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      this.initializing = false;
    }
  }

  public async validateSession(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const storedFingerprint = localStorage.getItem('session_fingerprint');
    const currentFingerprint = this.hashFingerprint(this.generateFingerprint());
    
    // Check fingerprint match
    if (storedFingerprint !== currentFingerprint) {
      securityService.logSecurityEvent({
        action: 'session_fingerprint_mismatch',
        success: false,
        userAgent: navigator.userAgent,
        additionalData: { 
          stored: storedFingerprint, 
          current: currentFingerprint 
        }
      });
      await this.invalidateSession();
      return false;
    }

    // Check session timeout
    const lastActivity = parseInt(localStorage.getItem('session_last_activity') || '0');
    const now = Date.now();
    
    if (now - lastActivity > this.sessionTimeout) {
      securityService.logSecurityEvent({
        action: 'session_timeout',
        success: false,
        userAgent: navigator.userAgent
      });
      await this.invalidateSession();
      return false;
    }

    // Update last activity
    await this.updateActivity();
    return true;
  }

  public async updateActivity(): Promise<void> {
    const now = Date.now();
    localStorage.setItem('session_last_activity', now.toString());

    // Update database record
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        await supabase
          .from('user_sessions')
          .update({ 
            last_activity: new Date().toISOString(),
            expires_at: new Date(now + this.sessionTimeout).toISOString()
          })
          .eq('session_token', session.access_token);
      } catch (error) {
        console.warn('Failed to update session activity:', error);
      }
    }
  }

  public async invalidateSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      try {
        // Mark session as inactive in database
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', session.access_token);
      } catch (error) {
        console.warn('Failed to invalidate session in database:', error);
      }
    }

    // Clear local storage
    localStorage.removeItem('session_fingerprint');
    localStorage.removeItem('session_last_activity');
    
    // Sign out user
    await supabase.auth.signOut();
    
    this.stopSessionMonitoring();
  }

  public async invalidateAllSessions(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Mark all user sessions as inactive
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', session.user.id);

      securityService.logSecurityEvent({
        action: 'all_sessions_invalidated',
        success: true,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to invalidate all sessions:', error);
    }

    await this.invalidateSession();
  }

  public startSessionMonitoring(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      const isValid = await this.validateSession();
      if (!isValid) {
        console.log('Session validation failed, signing out user');
      }
    }, this.checkInterval);
  }

  public stopSessionMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async getUserSessions(): Promise<SessionInfo[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(s => ({
        id: s.id,
        fingerprint: {
          userAgent: s.user_agent || '',
          screen: '',
          timezone: '',
          language: '',
          platform: ''
        },
        lastActivity: new Date(s.last_activity).getTime(),
        expiresAt: new Date(s.expires_at).getTime(),
        isActive: s.is_active
      }));
    } catch (error) {
      console.error('Failed to fetch user sessions:', error);
      return [];
    }
  }
}

export const sessionManager = new SessionManager();