
import { supabase } from '@/integrations/supabase/client';
import { RoomComponent } from '@/types';

export const ComponentAnalysisAPI = {
  /**
   * Update component with analysis results in a single transaction
   */
  updateComponentWithAnalysis: async (
    reportId: string,
    roomId: string,
    componentId: string,
    analysisResult: any,
    imageIds: string[]
  ): Promise<boolean> => {
    try {
      console.log(`🔄 Updating component ${componentId} with analysis results`);
      
      // Start transaction - update room component data
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          components: supabase.rpc('update_component_analysis', {
            room_id: roomId,
            component_id: componentId,
            analysis_data: analysisResult
          })
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('❌ Error updating component analysis:', updateError);
        throw updateError;
      }

      // Update image records with analysis flag
      if (imageIds.length > 0) {
        const { error: imageError } = await supabase
          .from('room_images')
          .update({ analysis: analysisResult })
          .in('id', imageIds);

        if (imageError) {
          console.warn('⚠️ Error updating image analysis flags:', imageError);
          // Don't throw - component update succeeded
        }
      }

      console.log(`✅ Component ${componentId} updated successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error in component analysis update:', error);
      throw error;
    }
  }
};
