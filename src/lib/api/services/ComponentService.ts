/**
 * ComponentService - Handles component analysis and updates
 * Consolidates: componentAnalysisApi.ts, componentUpdateApi.ts
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../repositories/BaseRepository';

export interface ComponentAnalysis {
  condition: string;
  description: string;
  defects?: string[];
  recommendations?: string[];
}

export class ComponentService extends BaseRepository {
  /**
   * Update component with analysis results
   */
  async updateWithAnalysis(
    reportId: string,
    roomId: string,
    componentId: string,
    analysis: ComponentAnalysis,
    imageIds: string[]
  ): Promise<boolean> {
    return await this.executeMutation(
      async () => {
        // Update the room_images with analysis
        for (const imageId of imageIds) {
          const { error } = await supabase
            .from('room_images')
            .update({
              analysis: {
                componentId,
                ...analysis,
                processedAt: new Date().toISOString()
              }
            })
            .eq('id', imageId)
            .eq('room_id', roomId);

          if (error) throw error;
        }

        // Update the inspection report_info with component analysis
        const { data: inspection, error: fetchError } = await supabase
          .from('inspections')
          .select('report_info')
          .eq('id', reportId)
          .single();

        if (fetchError) throw fetchError;

        const reportInfo = typeof inspection.report_info === 'object' && inspection.report_info !== null
          ? inspection.report_info as Record<string, any>
          : {};
        const components = Array.isArray(reportInfo.components) ? reportInfo.components : [];

        // Find and update the component
        const componentIndex = components.findIndex((c: any) => c.id === componentId);
        if (componentIndex !== -1) {
          components[componentIndex] = {
            ...components[componentIndex],
            ...analysis,
            images: imageIds
          };
        }

        // Save back to database
        const { error: updateError } = await supabase
          .from('inspections')
          .update({
            report_info: {
              ...(reportInfo as any),
              components
            }
          })
          .eq('id', reportId);

        if (updateError) throw updateError;

        return { data: true, error: null };
      },
      'ComponentService.updateWithAnalysis'
    );
  }

  /**
   * Update component condition
   */
  async updateCondition(
    reportId: string,
    componentId: string,
    condition: string
  ): Promise<void> {
    await this.executeMutation(
      async () => {
        const { data: inspection, error: fetchError } = await supabase
          .from('inspections')
          .select('report_info')
          .eq('id', reportId)
          .single();

        if (fetchError) throw fetchError;

        const reportInfo = typeof inspection.report_info === 'object' && inspection.report_info !== null
          ? inspection.report_info as Record<string, any>
          : {};
        const components = Array.isArray(reportInfo.components) ? reportInfo.components : [];

        // Find and update the component
        const componentIndex = components.findIndex((c: any) => c.id === componentId);
        if (componentIndex !== -1) {
          components[componentIndex].condition = condition;
        }

        // Save back to database
        const { error: updateError } = await supabase
          .from('inspections')
          .update({
            report_info: {
              ...(reportInfo as any),
              components
            }
          })
          .eq('id', reportId);

        if (updateError) throw updateError;

        return { data: null, error: null };
      },
      'ComponentService.updateCondition'
    );
  }
}

// Singleton instance
export const componentService = new ComponentService();
