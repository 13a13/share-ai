
import { Room } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ReportsAPI } from './reportsApi';
import { LOCAL_STORAGE_KEYS } from './utils';

// Gemini API implementation
export const GeminiAPI = {
  analyzeImage: async (imageUrl: string, roomType?: string): Promise<any> => {
    try {
      // Request simplified responses from the Gemini API
      const response = await supabase.functions.invoke('process-room-image', {
        body: { 
          imageUrl, 
          roomType,
          maxSentences: 2 // Request simplified responses (max 2 sentences)
        },
      });

      if (response.error) {
        console.error('Error calling Gemini API:', response.error);
        throw new Error('Failed to analyze image');
      }

      return response.data;
    } catch (error) {
      console.error('Error in analyzeImage:', error);
      throw error;
    }
  },
  
  processRoomImage: async (reportId: string, roomId: string, imageId: string): Promise<Room | null> => {
    const reports = await ReportsAPI.getAll();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return null;
    
    const report = reports[reportIndex];
    const roomIndex = report.rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) return null;
    
    const room = report.rooms[roomIndex];
    const imageIndex = room.images.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) return null;
    
    const imageUrl = room.images[imageIndex].url;
    
    try {
      const aiResult = await GeminiAPI.analyzeImage(imageUrl, room.type);
      
      room.images[imageIndex] = {
        ...room.images[imageIndex],
        aiProcessed: true,
        aiData: aiResult,
      };
      
      const updatedRoom: Room = {
        ...room,
        generalCondition: aiResult.roomAssessment.generalCondition,
        sections: room.sections.map(section => {
          const aiAssessment = aiResult.roomAssessment[section.type as keyof typeof aiResult.roomAssessment];
          
          if (aiAssessment) {
            return {
              ...section,
              description: aiAssessment,
            };
          }
          
          return section;
        }),
      };
      
      report.rooms[roomIndex] = updatedRoom;
      report.updatedAt = new Date();
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return updatedRoom;
    } catch (error) {
      console.error('Error processing room image:', error);
      return null;
    }
  },
};
