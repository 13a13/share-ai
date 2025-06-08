
import { RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { uploadReportImage } from '@/utils/supabaseStorage';

/**
 * API functions for room image operations
 */
export const RoomImageAPI = {
  /**
   * Add an image to a room
   */
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    try {
      // Store the image in Supabase Storage if it's a data URL
      let finalImageUrl = imageUrl;
      
      if (imageUrl.startsWith('data:')) {
        finalImageUrl = await uploadReportImage(imageUrl, reportId, roomId);
      }
      
      const imageId = crypto.randomUUID();
      
      // Save the image URL to the database
      const { data, error } = await supabase
        .from('inspection_images')
        .insert({
          id: imageId,
          inspection_id: reportId,
          image_url: finalImageUrl
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving inspection image:', error);
        throw error;
      }
      
      return {
        id: data.id,
        url: data.image_url,
        timestamp: new Date(data.created_at),
        aiProcessed: false
      };
    } catch (error) {
      console.error("Error adding image to room:", error);
      return null;
    }
  }
};
