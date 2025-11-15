/**
 * Production Logger - Replaces console logging with structured telemetry
 * 
 * SECURITY: Prevents sensitive data exposure in browser console logs
 * - Auto-sanitizes API keys, tokens, passwords, email, etc.
 * - Routes to telemetry service in production
 * - Retains console logging in development for debugging
 */

import { telemetryService } from '@/lib/api/services/TelemetryService';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogContext {
  userId?: string;
  operation?: string;
  resource?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  
  private constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.DEBUG;
    }
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }
  
  private sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'apiKey', 'authToken',
      'email', 'phone', 'ssn', 'creditCard', 'api_key', 'gemini_key',
      'geminiApiKey', 'openaiApiKey', 'stripeKey', 'serviceRoleKey',
      'databaseUrl', 'connectionString', 'privateKey'
    ];
    
    if (Array.isArray(sanitized)) {
      return sanitized.map(item => this.sanitizeForLogging(item));
    }
    
    for (const field of sensitiveFields) {
      // Check exact match
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
      
      // Check case-insensitive partial matches
      for (const key of Object.keys(sanitized)) {
        if (key.toLowerCase().includes(field.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }
    
    // Sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value);
      }
    }
    
    return sanitized;
  }
  
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.logToTelemetry('debug', message, context);
    }
  }
  
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.logToTelemetry('info', message, context);
    }
  }
  
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.logToTelemetry('warn', message, context);
    }
  }
  
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        metadata: {
          ...context?.metadata,
          error: error ? {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack
          } : undefined
        }
      };
      this.logToTelemetry('error', message, errorContext);
    }
  }
  
  private async logToTelemetry(
    level: string, 
    message: string, 
    context?: LogContext
  ): Promise<void> {
    try {
      const sanitizedContext = context ? this.sanitizeForLogging(context) : undefined;
      
      // In production, send to telemetry (fire and forget)
      if (!import.meta.env.DEV) {
        telemetryService.record({
          operation: context?.operation || 'log',
          resource: context?.resource || 'Logger',
          duration_ms: 0,
          status: level === 'error' ? 'error' : 'success',
          metadata: {
            level,
            message,
            ...sanitizedContext?.metadata
          }
        }).catch(() => {
          // Silently fail - don't expose telemetry errors to console
        });
      } else {
        // In development, still log to console for debugging
        const logFn = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : 
                     console.log;
        logFn(`[${level.toUpperCase()}] ${message}`, sanitizedContext);
      }
    } catch (telemetryError) {
      // Silently fail in production to avoid console spam
      if (import.meta.env.DEV) {
        console.error('[Logger] Failed to log:', telemetryError);
      }
    }
  }
}

// Singleton instance
export const logger = Logger.getInstance();
