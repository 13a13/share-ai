/**
 * Step 1: Telemetry Service
 * 
 * Central service for recording API observability events.
 * All API operations automatically log to telemetry_events table for monitoring.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TelemetryInsert = Database['public']['Tables']['telemetry_events']['Insert'];
type Json = Database['public']['Tables']['telemetry_events']['Row']['metadata'];

export interface TelemetryEvent {
  operation: string;
  resource: string;
  duration_ms: number;
  status: 'success' | 'error';
  error_class?: string;
  error_message?: string;
  metadata?: Json;
}

export class TelemetryService {
  /**
   * Record an API operation event to telemetry
   * Silently fails to avoid breaking API operations
   */
  async record(event: TelemetryEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const telemetryData: TelemetryInsert = {
        user_id: user?.id || null,
        operation: event.operation,
        resource: event.resource,
        duration_ms: event.duration_ms,
        status: event.status,
        error_class: event.error_class || null,
        error_message: event.error_message || null,
        metadata: (event.metadata as Json) || {},
      };

      // Fire and forget - don't block API operations
      supabase
        .from('telemetry_events')
        .insert(telemetryData)
        .then(({ error }) => {
          if (error) {
            console.warn('[TelemetryService] Failed to record event:', error);
          }
        });
    } catch (error) {
      // Silently fail to avoid breaking API operations
      console.warn('[TelemetryService] Failed to record telemetry:', error);
    }
  }

  /**
   * Batch record multiple events (for performance)
   */
  async recordBatch(events: TelemetryEvent[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const telemetryData: TelemetryInsert[] = events.map(event => ({
        user_id: user?.id || null,
        operation: event.operation,
        resource: event.resource,
        duration_ms: event.duration_ms,
        status: event.status,
        error_class: event.error_class || null,
        error_message: event.error_message || null,
        metadata: (event.metadata as Json) || {},
      }));

      // Fire and forget
      supabase
        .from('telemetry_events')
        .insert(telemetryData)
        .then(({ error }) => {
          if (error) {
            console.warn('[TelemetryService] Failed to record batch:', error);
          }
        });
    } catch (error) {
      console.warn('[TelemetryService] Failed to record telemetry batch:', error);
    }
  }

  /**
   * Query telemetry for performance analysis
   */
  async getOperationMetrics(
    operation: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
    totalCalls: number;
  }> {
    let query = supabase
      .from('telemetry_events')
      .select('duration_ms, status')
      .eq('operation', operation);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(`Failed to fetch metrics: ${error?.message}`);
    }

    const durations = data.map(e => e.duration_ms || 0).sort((a, b) => a - b);
    const errors = data.filter(e => e.status === 'error').length;

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      errorRate: (errors / data.length) * 100 || 0,
      totalCalls: data.length,
    };
  }
}

// Singleton instance
export const telemetryService = new TelemetryService();
