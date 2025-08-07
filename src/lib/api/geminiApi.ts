
/**
 * PDF Generation API
 * Simulates a backend service that would generate PDF documents
 */
import { Room } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Gemini API implementation
export const GeminiAPI = {
  async processRoomImage(reportId: string, roomId: string, imageId: string): Promise<Room | null> {
    try {
      const { data, error } = await supabase.functions.invoke('process-room-image', {
        body: {
          reportId,
          roomId,
          imageIds: [imageId],
          inventoryMode: true,
          useAdvancedAnalysis: false,
        },
      });
      if (error) throw error;
      return data?.room ?? null;
    } catch (error) {
      console.error('Failed to process room image:', error);
      throw error;
    }
  },
  async processMultipleRoomImages(reportId: string, roomId: string, imageIds: string[]): Promise<Room | null> {
    try {
      const { data, error } = await supabase.functions.invoke('process-room-image', {
        body: {
          reportId,
          roomId,
          imageIds,
          inventoryMode: true,
          useAdvancedAnalysis: true,
        },
      });
      if (error) throw error;
      return data?.room ?? null;
    } catch (error) {
      console.error('Failed to process multiple room images:', error);
      throw error;
    }
  },
};
