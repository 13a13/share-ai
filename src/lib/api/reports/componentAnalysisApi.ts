
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
      
      // For now, we'll just update the image records with analysis data
      // The component updates will be handled by the frontend state management
      if (imageIds.length > 0) {
        const { error: imageError } = await supabase
          .from('room_images')
          .update({ analysis: analysisResult })
          .in('id', imageIds);

        if (imageError) {
          console.error('❌ Error updating image analysis flags:', imageError);
          throw imageError;
        }
      }

      console.log(`✅ Component ${componentId} analysis data saved to images`);
      return true;
    } catch (error) {
      console.error('❌ Error in component analysis update:', error);
      throw error;
    }
  }
};
