
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
      console.log("Adding image to room:", roomId, "in report:", reportId);
      
      // Check if storage bucket is available
      const bucketExists = await checkStorageBucket();
      console.log("Storage bucket available:", bucketExists);
      
      // Store the image in Supabase Storage if it's a data URL and bucket exists
      let finalImageUrl = imageUrl;
      
      if (imageUrl.startsWith('data:') && bucketExists) {
        try {
          console.log("Uploading data URL to storage...");
          finalImageUrl = await uploadReportImage(imageUrl, reportId, roomId);
          console.log("Upload successful, new URL:", finalImageUrl);
        } catch (storageError) {
          console.warn("Failed to upload to storage, using original URL:", storageError);
          finalImageUrl = imageUrl;
        }
      } else if (!bucketExists) {
        console.warn("Storage bucket not available, using original image URL");
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
      
      console.log("Image saved to database:", data);
      
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
  },

  /**
   * Get images for a room/inspection
   */
  getImagesForRoom: async (reportId: string): Promise<RoomImage[]> => {
    try {
      const { data, error } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_id', reportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching inspection images:', error);
        throw error;
      }

      return data.map(image => ({
        id: image.id,
        url: image.image_url,
        timestamp: new Date(image.created_at),
        aiProcessed: !!image.analysis
      }));
    } catch (error) {
      console.error("Error getting images for room:", error);
      return [];
    }
  },

  /**
   * Delete an image from a room
   */
  deleteImageFromRoom: async (imageId: string): Promise<boolean> => {
    try {
      // First get the image to delete from storage
      const { data: imageData, error: fetchError } = await supabase
        .from('inspection_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('Error fetching image for deletion:', fetchError);
        return false;
      }

      // Delete from storage if it's a Supabase storage URL
      if (imageData?.image_url) {
        try {
          const { deleteReportImage } = await import('@/utils/supabaseStorage');
          await deleteReportImage(imageData.image_url);
        } catch (storageError) {
          console.warn("Failed to delete from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('inspection_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting inspection image:', error);
        return false;
      }

      console.log("Image deleted successfully from database");
      return true;
    } catch (error) {
      console.error("Error deleting image from room:", error);
      return false;
    }
  }
};
