
/**
 * Retry utility with exponential backoff and jitter for storage operations
 */

export interface RetryConfig {
  maxAttempts: number;      // 3-5 attempts
  baseDelay: number;        // 1000ms initial delay
  maxDelay: number;         // 10000ms max delay
  backoffFactor: number;    // 2.0 exponential multiplier
  jitter: boolean;          // Add randomness to prevent thundering herd
  retryableErrors: string[]; // Error types that should trigger retries
}

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  delay: number;
  error: Error | null;
  isRetryable: boolean;
}

export type ProgressCallback = (context: RetryContext) => void;

// Default retry configuration optimized for Supabase storage operations
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2.0,
  jitter: true,
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'fetch',
    'Failed to fetch',
    'Load failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'Storage rate limit exceeded',
    'Service temporarily unavailable',
    '503',
    '502',
    '429'
  ]
};

/**
 * Determines if an error is retryable based on configuration
 */
export const isRetryableError = (error: Error, config: RetryConfig): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  console.log(`🔍 [RETRY] Checking if error is retryable:`, {
    errorName,
    errorMessage: errorMessage.substring(0, 100),
    retryableErrors: config.retryableErrors
  });

  // Check if error matches any retryable patterns
  const isRetryable = config.retryableErrors.some(pattern => 
    errorMessage.includes(pattern.toLowerCase()) || 
    errorName.includes(pattern.toLowerCase())
  );

  console.log(`🔍 [RETRY] Error retryable status: ${isRetryable}`);
  return isRetryable;
};

/**
 * Calculates delay with exponential backoff and optional jitter
 */
export const calculateDelay = (
  attempt: number, 
  config: RetryConfig
): number => {
  let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  
  // Apply maximum delay cap
  delay = Math.min(delay, config.maxDelay);
  
  // Add jitter to prevent thundering herd
  if (config.jitter) {
    const jitterAmount = delay * 0.1; // 10% jitter
    delay += (Math.random() - 0.5) * 2 * jitterAmount;
  }
  
  return Math.max(delay, 0);
};

/**
 * Generic retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onProgress?: ProgressCallback
): Promise<T> {
  let lastError: Error;
  
  console.log(`🔄 [RETRY] Starting operation with config:`, {
    maxAttempts: config.maxAttempts,
    baseDelay: config.baseDelay,
    backoffFactor: config.backoffFactor,
    jitter: config.jitter
  });

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`🚀 [RETRY] Attempt ${attempt}/${config.maxAttempts}`);
      
      // Notify progress callback
      if (onProgress) {
        onProgress({
          attempt,
          totalAttempts: config.maxAttempts,
          delay: 0,
          error: null,
          isRetryable: true
        });
      }

      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ [RETRY] Operation succeeded on attempt ${attempt}/${config.maxAttempts}`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      const isRetryable = isRetryableError(lastError, config);
      
      console.log(`❌ [RETRY] Attempt ${attempt}/${config.maxAttempts} failed:`, {
        error: lastError.message,
        isRetryable,
        willRetry: isRetryable && attempt < config.maxAttempts
      });

      // If this is the last attempt or error is not retryable, throw immediately
      if (attempt === config.maxAttempts || !isRetryable) {
        console.log(`🛑 [RETRY] Final failure after ${attempt} attempts. Error: ${lastError.message}`);
        
        // Notify progress callback of final failure
        if (onProgress) {
          onProgress({
            attempt,
            totalAttempts: config.maxAttempts,
            delay: 0,
            error: lastError,
            isRetryable
          });
        }
        
        throw lastError;
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, config);
      console.log(`⏳ [RETRY] Waiting ${delay}ms before attempt ${attempt + 1}`);
      
      // Notify progress callback about retry delay
      if (onProgress) {
        onProgress({
          attempt,
          totalAttempts: config.maxAttempts,
          delay,
          error: lastError,
          isRetryable: true
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Storage-specific retry configuration
 */
export const STORAGE_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 2.0
};

/**
 * Batch operation retry configuration (more conservative)
 */
export const BATCH_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 2,
  baseDelay: 500,
  maxDelay: 5000,
  backoffFactor: 2.0
};
