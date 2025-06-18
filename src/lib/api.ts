
// This file is maintained for backward compatibility
// All APIs are now modularized in the /api directory
export * from './api/index';

import { supabase } from '@/integrations/supabase/client';
import { RoomImageAPI } from './api/reports/roomImageApi';

export const GeminiAPI = {
  async processRoomImage(reportId: string, roomId: string, imageId: string) {
    try {
      console.log(`🤖 Processing single room image: ${imageId}`);
      
      const { data, error } = await supabase.functions.invoke('process-room-image', {
        body: {
          reportId,
          roomId,
          imageIds: [imageId], // Single image in array for consistency
          inventoryMode: true,
          useAdvancedAnalysis: false
        }
      });

      if (error) {
        console.error('Error processing room image:', error);
        throw error;
      }

      console.log(`✅ Single image processing complete:`, data);
      return data.room;
    } catch (error) {
      console.error('Failed to process room image:', error);
      throw error;
    }
  },

  async processMultipleRoomImages(reportId: string, roomId: string, imageIds: string[]) {
    try {
      console.log(`🤖 Processing multiple room images together:`, imageIds);
      
      const { data, error } = await supabase.functions.invoke('process-room-image', {
        body: {
          reportId,
          roomId,
          imageIds, // All image IDs for multi-image analysis
          inventoryMode: true,
          useAdvancedAnalysis: true // Enable advanced analysis for multiple images
        }
      });

      if (error) {
        console.error('Error processing multiple room images:', error);
        throw error;
      }

      console.log(`✅ Multiple images processing complete:`, data);
      return data.room;
    } catch (error) {
      console.error('Failed to process multiple room images:', error);
      throw error;
    }
  },

  async processComponentImage(
    reportId: string,
    roomId: string,
    componentId: string,
    imageUrls: string[],
    roomType: string,
    componentName: string,
    multipleImages: boolean = false
  ) {
    try {
      console.log(`🤖 Processing component image for: ${componentName}`);
      
      const { data, error } = await supabase.functions.invoke('process-room-image', {
        body: {
          images: imageUrls,
          componentName,
          roomType,
          reportId,
          roomId,
          componentId,
          inventoryMode: false,
          useAdvancedAnalysis: multipleImages && imageUrls.length > 1
        }
      });

      if (error) {
        console.error('Error processing component image:', error);
        throw error;
      }

      console.log(`✅ Component processing complete:`, data);
      return data;
    } catch (error) {
      console.error('Failed to process component image:', error);
      throw error;
    }
  }
};

// Re-export the updated ReportsAPI that includes room image operations
export const ReportsAPI = {
  // Re-export room image methods from the updated API
  addImageToRoom: RoomImageAPI.addImageToRoom,
  getImagesForRoom: RoomImageAPI.getImagesForRoom,
  deleteImageFromRoom: RoomImageAPI.deleteImageFromRoom,
  
  // Note: Other ReportsAPI methods are exported from the main API index
  // This provides backward compatibility while using the new room_images table
};
