/**
 * EdgeFunctionAdapter - Centralized adapter for Supabase Edge Function calls
 * Provides retry logic, telemetry, and error handling for all edge function invocations
 */

import { supabase } from '@/integrations/supabase/client';
import { TelemetryService } from '../services/TelemetryService';
import { logger } from '@/lib/logging/Logger';

export interface EdgeFunctionOptions {
  retries?: number;
  timeout?: number;
  metadata?: Record<string, any>;
}

export class EdgeFunctionAdapter {
  private telemetry = new TelemetryService();

  /**
   * Invoke an edge function with automatic retry and telemetry
   */
  async invokeWithRetry<T = any>(
    functionName: string,
    payload: any,
    options: EdgeFunctionOptions = {}
  ): Promise<T> {
    const {
      retries = 3,
      timeout = 60000,
      metadata = {}
    } = options;

    const startTime = performance.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < retries) {
      try {
        logger.debug(`Invoking ${functionName}`, {
          operation: 'edge_function_invoke',
          resource: 'EdgeFunctionAdapter',
          metadata: { 
            functionName, 
            attempt: attempt + 1, 
            retries,
            payloadSize: JSON.stringify(payload).length
          }
        });
        
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });

        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }

        // Record success
        await this.telemetry.record({
          operation: `edge_function_${functionName}`,
          resource: 'EdgeFunctionAdapter',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'success',
          metadata: {
            ...metadata,
            attempt: attempt + 1,
            functionName
          }
        });

        logger.info(`${functionName} succeeded`, {
          operation: 'edge_function_success',
          resource: 'EdgeFunctionAdapter',
          metadata: { 
            functionName,
            duration: Math.round(performance.now() - startTime)
          }
        });
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        logger.warn(`${functionName} attempt failed`, {
          operation: 'edge_function_retry',
          resource: 'EdgeFunctionAdapter',
          metadata: { 
            functionName,
            attempt,
            retries,
            error: lastError.message
          }
        });

        // If this was the last retry, record the failure
        if (attempt >= retries) {
          await this.telemetry.record({
            operation: `edge_function_${functionName}`,
            resource: 'EdgeFunctionAdapter',
            duration_ms: Math.round(performance.now() - startTime),
            status: 'error',
            error_class: lastError.constructor.name,
            error_message: lastError.message,
            metadata: {
              ...metadata,
              attempt,
              functionName
            }
          });

          throw lastError;
        }

        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt - 1);
        logger.debug(`Retrying ${functionName}`, {
          operation: 'edge_function_backoff',
          resource: 'EdgeFunctionAdapter',
          metadata: { functionName, delay }
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Invoke multiple edge functions in parallel
   */
  async invokeMany<T = any>(
    invocations: Array<{
      functionName: string;
      payload: any;
      options?: EdgeFunctionOptions;
    }>
  ): Promise<T[]> {
    const startTime = performance.now();

    try {
      const results = await Promise.all(
        invocations.map(({ functionName, payload, options }) =>
          this.invokeWithRetry<T>(functionName, payload, options)
        )
      );

      await this.telemetry.record({
        operation: 'edge_function_batch',
        resource: 'EdgeFunctionAdapter',
        duration_ms: Math.round(performance.now() - startTime),
        status: 'success',
        metadata: {
          batchSize: invocations.length,
          functions: invocations.map(i => i.functionName)
        }
      });

      return results;
    } catch (error) {
      await this.telemetry.record({
        operation: 'edge_function_batch',
        resource: 'EdgeFunctionAdapter',
        duration_ms: Math.round(performance.now() - startTime),
        status: 'error',
        error_class: error instanceof Error ? error.constructor.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : String(error),
        metadata: {
          batchSize: invocations.length,
          functions: invocations.map(i => i.functionName)
        }
      });

      throw error;
    }
  }
}

// Singleton instance
export const edgeFunctionAdapter = new EdgeFunctionAdapter();
