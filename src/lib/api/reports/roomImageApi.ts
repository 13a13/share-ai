
import { RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * API functions for room image operations with guaranteed storage persistence
 * Updated to use the new room_images table as the primary source of truth
 */
export const RoomImageAPI = {
  /**
   * Add an image to a room - only accepts storage URLs, not data URLs
   */
  addImageToRoom: async (reportId: string, roomId: string, imageUrl: string): Promise<RoomImage | null> => {
    try {
      console.log("💾 Adding image to room:", roomId, "in report:", reportId);
      
      // Validate that we're not storing data URLs in the database
      if (imageUrl.startsWith('data:')) {
        console.error("❌ Cannot save data URL to database - image must be uploaded to storage first");
        throw new Error("Image must be uploaded to storage before saving to database");
      }
      
      console.log("🔗 Storage URL validated:", imageUrl.substring(0, 100) + '...');
      
      // Generate a unique image ID
      const imageId = crypto.randomUUID();
      console.log("🆔 Generated image ID:", imageId);
      
      // Save the storage URL to the database (room_images table)
      const { data, error } = await supabase
        .from('room_images')
        .insert({
          id: imageId,
          room_id: roomId,
          inspection_id: reportId,
          url: imageUrl
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error saving image to database:', error);
        throw error;
      }
      
      console.log("✅ Image record saved to database:", {
        id: data.id,
        room_id: data.room_id,
        inspection_id: data.inspection_id,
        url: data.url.substring(0, 80) + '...',
        created_at: data.created_at
      });
      
      return {
        id: data.id,
        url: data.url,
        timestamp: new Date(data.created_at),
        aiProcessed: !!data.analysis
      };
    } catch (error) {
      console.error("❌ Error adding image to room:", error);
      return null;
    }
  },

  /**
   * Get images for a room using room_id and inspection_id
   */
  getImagesForRoom: async (reportId: string, roomId: string): Promise<RoomImage[]> => {
    try {
      console.log("📖 Fetching images for room:", roomId, "in inspection:", reportId);
      
      const { data, error } = await supabase
        .from('room_images')
        .select('*')
        .eq('inspection_id', reportId)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching room images:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} images for room ${roomId} in inspection ${reportId}`);
      
      return (data || []).map(image => ({
        id: image.id,
        url: image.url,
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
        .from('room_images')
        .select('url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching image for deletion:', fetchError);
        return false;
      }

      // Delete from storage if it's a Supabase storage URL
      if (imageData?.url && !imageData.url.startsWith('data:')) {
        try {
          const { deleteReportImage } = await import('@/utils/supabaseStorage');
          await deleteReportImage(imageData.url);
          console.log("✅ Image deleted from storage");
        } catch (storageError) {
          console.warn("⚠️ Failed to delete from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('room_images')
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
