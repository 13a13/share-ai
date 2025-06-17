
/**
 * Pre-configured retry configurations for different scenarios
 */

import { RetryConfig } from './retryCore';

const COMMON_RETRYABLE_ERRORS = [
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
];

/**
 * Default retry configuration optimized for Supabase storage operations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2.0,
  jitter: true,
  retryableErrors: COMMON_RETRYABLE_ERRORS
};

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
