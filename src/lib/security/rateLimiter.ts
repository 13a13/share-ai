
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private configs: Record<string, RateLimitConfig> = {
    login: { windowMs: 15 * 60 * 1000, maxAttempts: 5, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per 15min, block for 30min
    register: { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour, block for 1 hour
    socialLogin: { windowMs: 5 * 60 * 1000, maxAttempts: 10, blockDurationMs: 15 * 60 * 1000 }, // 10 attempts per 5min, block for 15min
    passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 2 * 60 * 60 * 1000 }, // 3 attempts per hour, block for 2 hours
  };

  private getClientId(): string {
    // Use multiple identifiers for better tracking
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');
    
    return btoa(fingerprint).slice(0, 16);
  }

  private getKey(action: string, identifier?: string): string {
    const clientId = this.getClientId();
    const id = identifier || clientId;
    return `${action}:${id}`;
  }

  public checkLimit(action: string, identifier?: string): { allowed: boolean; remainingAttempts: number; resetTime: number } {
    const config = this.configs[action];
    if (!config) throw new Error(`Unknown action: ${action}`);

    const key = this.getKey(action, identifier);
    const now = Date.now();
    let entry = this.storage.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      entry = undefined;
      this.storage.delete(key);
    }

    // Check if currently blocked
    if (entry?.blocked && now < entry.resetTime) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.resetTime
      };
    }

    // Initialize or reset entry
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
    }

    const remainingAttempts = Math.max(0, config.maxAttempts - entry.count);
    
    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      resetTime: entry.resetTime
    };
  }

  public recordAttempt(action: string, identifier?: string, success: boolean = false): void {
    const config = this.configs[action];
    if (!config) throw new Error(`Unknown action: ${action}`);

    const key = this.getKey(action, identifier);
    const now = Date.now();
    let entry = this.storage.get(key);

    // Initialize entry if needed
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
    }

    // Increment attempt count
    entry.count++;

    // If this was a successful attempt, reset the counter
    if (success) {
      entry.count = 0;
      entry.blocked = false;
    } else if (entry.count >= config.maxAttempts) {
      // Block if max attempts reached
      entry.blocked = true;
      entry.resetTime = now + config.blockDurationMs;
    }

    this.storage.set(key, entry);
  }

  public isBlocked(action: string, identifier?: string): boolean {
    const result = this.checkLimit(action, identifier);
    return !result.allowed;
  }

  public getRemainingTime(action: string, identifier?: string): number {
    const key = this.getKey(action, identifier);
    const entry = this.storage.get(key);
    if (!entry?.blocked) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  // Clean up old entries periodically
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime && !entry.blocked) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
