
/**
 * Core retry functionality with exponential backoff and jitter
 */

export interface RetryConfig {
  maxAttempts: number;      
  baseDelay: number;        
  maxDelay: number;         
  backoffFactor: number;    
  jitter: boolean;          
  retryableErrors: string[]; 
}

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  delay: number;
  error: Error | null;
  isRetryable: boolean;
}

export type ProgressCallback = (context: RetryContext) => void;

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
  
  delay = Math.min(delay, config.maxDelay);
  
  if (config.jitter) {
    const jitterAmount = delay * 0.1;
    delay += (Math.random() - 0.5) * 2 * jitterAmount;
  }
  
  return Math.max(delay, 0);
};

/**
 * Generic retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
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

      if (attempt === config.maxAttempts || !isRetryable) {
        console.log(`🛑 [RETRY] Final failure after ${attempt} attempts. Error: ${lastError.message}`);
        
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

      const delay = calculateDelay(attempt, config);
      console.log(`⏳ [RETRY] Waiting ${delay}ms before attempt ${attempt + 1}`);
      
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

  throw lastError!;
}
