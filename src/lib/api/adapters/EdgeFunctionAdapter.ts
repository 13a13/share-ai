/**
 * EdgeFunctionAdapter - Centralized adapter for Supabase Edge Function calls
 * Provides retry logic, telemetry, and error handling for all edge function invocations
 */

import { supabase } from '@/integrations/supabase/client';
import { TelemetryService } from '../services/TelemetryService';

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
        console.log(`[EdgeFunctionAdapter] Invoking ${functionName} (attempt ${attempt + 1}/${retries})`);
        
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

        console.log(`[EdgeFunctionAdapter] ${functionName} succeeded in ${Math.round(performance.now() - startTime)}ms`);
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        console.warn(
          `[EdgeFunctionAdapter] ${functionName} attempt ${attempt}/${retries} failed:`,
          lastError.message
        );

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
        console.log(`[EdgeFunctionAdapter] Retrying ${functionName} in ${delay}ms...`);
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
