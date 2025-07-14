
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
      
      // Validate inputs
      if (!analysisResult || typeof analysisResult !== 'object') {
        console.warn('⚠️ Invalid analysis result provided:', analysisResult);
        return false;
      }

      if (!imageIds || imageIds.length === 0) {
        console.warn('⚠️ No image IDs provided for analysis update');
        return false;
      }
      
      // Update the image records with analysis data with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { error: imageError } = await supabase
            .from('room_images')
            .update({ 
              analysis: analysisResult,
              updated_at: new Date().toISOString()
            })
            .in('id', imageIds);

          if (imageError) {
            console.error('❌ Error updating image analysis flags:', imageError);
            throw imageError;
          }

          console.log(`✅ Component ${componentId} analysis data saved to images`);
          return true;
        } catch (dbError) {
          retryCount++;
          console.warn(`⚠️ Database update attempt ${retryCount} failed:`, dbError);
          
          if (retryCount >= maxRetries) {
            throw dbError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error in component analysis update:', error);
      throw error;
    }
  }
};
