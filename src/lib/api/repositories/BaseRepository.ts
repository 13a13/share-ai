/**
 * Step 1: Base Repository
 * 
 * Abstract base class for all repositories providing:
 * - Automatic telemetry tracking
 * - Consistent error handling
 * - Retry logic for transient failures
 * - Type-safe query execution
 */

import { PostgrestError } from '@supabase/supabase-js';
import { ApiError, DatabaseError } from '../errors/ApiErrors';
import { TelemetryService } from '../services/TelemetryService';
import { z } from 'zod';

export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMs: 1000,
  retryableErrors: ['PGRST301', 'PGRST504', '40001'], // Connection, timeout, serialization
};

export abstract class BaseRepository<T = unknown> {
  protected telemetry = new TelemetryService();

  /**
   * Execute a query with automatic telemetry and error handling
   */
  protected async executeQuery<TResult>(
    queryFn: () => Promise<{ data: TResult | null; error: PostgrestError | null }>,
    operation: string
  ): Promise<TResult> {
    const startTime = performance.now();
    const resourceName = this.constructor.name;

    try {
      const { data, error } = await queryFn();

      if (error) {
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      if (data === null) {
        throw new DatabaseError('Query returned null data', {
          operation,
        });
      }

      // Record success
      await this.telemetry.record({
        operation,
        resource: resourceName,
        duration_ms: Math.round(performance.now() - startTime),
        status: 'success',
      });

      return data;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      // Record error
      await this.telemetry.record({
        operation,
        resource: resourceName,
        duration_ms: duration,
        status: 'error',
        error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : String(error),
      });

      throw this.handleError(operation, error);
    }
  }

  /**
   * Execute a mutation (INSERT/UPDATE/DELETE) with retry logic
   */
  protected async executeMutation<TResult>(
    mutationFn: () => Promise<{ data: TResult | null; error: PostgrestError | null }>,
    operation: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<TResult> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < config.maxRetries) {
      try {
        return await this.executeQuery(mutationFn, operation);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError, config.retryableErrors);

        if (!isRetryable || attempt >= config.maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = config.backoffMs * Math.pow(2, attempt - 1);
        console.warn(
          `[${this.constructor.name}] Retry ${attempt}/${config.maxRetries} after ${delay}ms for ${operation}`,
          lastError.message
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Validate input using Zod schema
   */
  protected validateInput<S>(schema: z.ZodSchema<S>, input: unknown): S {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ApiError(
          `Validation failed for ${firstError.path.join('.')}: ${firstError.message}`,
          'VALIDATION_ERROR',
          400
        );
      }
      throw error;
    }
  }

  /**
   * Handle errors with context
   */
  protected handleError(operation: string, error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new DatabaseError(`${operation} failed: ${error.message}`, {
        originalError: error.message,
      });
    }

    return new DatabaseError(`${operation} failed: Unknown error`, {
      originalError: String(error),
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, retryableCodes: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Check for network/timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('econnrefused')
    ) {
      return true;
    }

    // Check for specific error codes
    if (error instanceof DatabaseError && error.context?.code) {
      return retryableCodes.includes(error.context.code as string);
    }

    return false;
  }

  /**
   * Execute batch operations in parallel
   */
  protected async executeBatch<TResult>(
    operations: Array<() => Promise<TResult>>,
    operationName: string
  ): Promise<TResult[]> {
    const startTime = performance.now();

    try {
      const results = await Promise.all(operations.map(op => op()));

      await this.telemetry.record({
        operation: `${operationName}_batch`,
        resource: this.constructor.name,
        duration_ms: Math.round(performance.now() - startTime),
        status: 'success',
        metadata: { batchSize: operations.length },
      });

      return results;
    } catch (error) {
      await this.telemetry.record({
        operation: `${operationName}_batch`,
        resource: this.constructor.name,
        duration_ms: Math.round(performance.now() - startTime),
        status: 'error',
        error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : String(error),
        metadata: { batchSize: operations.length },
      });

      throw error;
    }
  }
}
