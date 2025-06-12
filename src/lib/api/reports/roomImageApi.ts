
import { RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { uploadReportImage, checkStorageBucket } from '@/utils/supabaseStorage';

/**
 * API functions for room image operations
 */
export const RoomImageAPI = {
  /**
   * Add an image to a room
   */
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    try {
      console.log("💾 Adding image to room:", roomId, "in report:", reportId);
      console.log("🔗 Image URL type:", imageUrl.startsWith('data:') ? 'data URL' : 'external URL');
      
      // Generate a unique image ID
      const imageId = crypto.randomUUID();
      console.log("🆔 Generated image ID:", imageId);
      
      // Save the image URL to the database (inspection_images table)
      const { data, error } = await supabase
        .from('inspection_images')
        .insert({
          id: imageId,
          inspection_id: reportId,
          image_url: imageUrl
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error saving image to database:', error);
        throw error;
      }
      
      console.log("✅ Image record saved to database:", {
        id: data.id,
        inspection_id: data.inspection_id,
        image_url: data.image_url.substring(0, 50) + (data.image_url.length > 50 ? '...' : ''),
        created_at: data.created_at
      });
      
      return {
        id: data.id,
        url: data.image_url,
        timestamp: new Date(data.created_at),
        aiProcessed: false
      };
    } catch (error) {
      console.error("❌ Error adding image to room:", error);
      return null;
    }
  },

  /**
   * Get images for a room/inspection
   */
  getImagesForRoom: async (reportId: string): Promise<RoomImage[]> => {
    try {
      console.log("📖 Fetching images for inspection:", reportId);
      
      const { data, error } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_id', reportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching inspection images:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} images for inspection ${reportId}`);
      
      return (data || []).map(image => ({
        id: image.id,
        url: image.image_url,
        timestamp: new Date(image.created_at),
        aiProcessed: !!image.analysis
      }));
    } catch (error) {
      console.error("❌ Error getting images for room:", error);
      return [];
    }
  },

  /**
   * Delete an image from a room
   */
  deleteImageFromRoom: async (imageId: string): Promise<boolean> => {
    try {
      console.log("🗑️ Deleting image with ID:", imageId);
      
      // First get the image to delete from storage
      const { data: imageData, error: fetchError } = await supabase
        .from('inspection_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching image for deletion:', fetchError);
        return false;
      }

      // Delete from storage if it's a Supabase storage URL
      if (imageData?.image_url) {
        try {
          const { deleteReportImage } = await import('@/utils/supabaseStorage');
          await deleteReportImage(imageData.image_url);
          console.log("✅ Image deleted from storage");
        } catch (storageError) {
          console.warn("⚠️ Failed to delete from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('inspection_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('❌ Error deleting image from database:', error);
        return false;
      }

      console.log("✅ Image deleted successfully from database");
      return true;
    } catch (error) {
      console.error("❌ Error deleting image from room:", error);
      return false;
    }
  }
};
