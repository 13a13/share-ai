
import { Room, RoomType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo, formatRoomType } from './reportTransformers';

/**
 * Core CRUD operations for rooms
 */
export const RoomCrudAPI = {
  /**
   * Add a new room to a report
   */
  addRoom: async (reportId: string, name: string, type: RoomType): Promise<Room | null> => {
    try {
      console.log(`Adding new room: ${name} (${type})`);
      
      // Get the report first to get the property ID
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();
      
      if (!inspection) {
        console.error("No inspection found for report:", reportId);
        return null;
      }
      
      // Get the existing room to get the property ID
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('property_id')
        .eq('id', inspection.room_id)
        .single();
        
      if (!existingRoom) {
        console.error("No existing room found for inspection:", inspection.room_id);
        return null;
      }
      
      // Create a new room with the same property ID
      const roomId = crypto.randomUUID();
      
      await supabase.from('rooms').insert({
        id: roomId,
        property_id: existingRoom.property_id,
        type: type,
      });
      
      console.log(`Created new room with ID: ${roomId}`);
      
      // Store the room name and other data in the report_info of the inspection
      const existingReportInfo = parseReportInfo(inspection.report_info);
        
      const additionalRooms = Array.isArray(existingReportInfo.additionalRooms) 
        ? existingReportInfo.additionalRooms 
        : [];
      
      additionalRooms.push({
        id: roomId,
        name: name,
        type: type,
        generalCondition: '',
        components: []
      });
      
      // Update the inspection with the additional room info
      await supabase
        .from('inspections')
        .update({
          report_info: {
            ...existingReportInfo,
            additionalRooms: additionalRooms
          }
        })
        .eq('id', reportId);
      
      // Return the room in our client format
      return {
        id: roomId,
        name: name,
        type: type,
        order: additionalRooms.length,
        generalCondition: '',
        images: [],
        sections: [],
        components: []
      };
    } catch (error) {
      console.error("Error adding room:", error);
      return null;
    }
  },

  /**
   * Delete a room
   */
  deleteRoom: async (reportId: string, roomId: string): Promise<void> => {
    try {
      // Get the inspection first
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();
        
      if (!inspection) {
        console.error("Inspection not found:", reportId);
        return;
      }
      
      // Check if this is the main room
      if (inspection.room_id === roomId) {
        // Can't delete the main room, just clear its data
        const reportInfo = parseReportInfo(inspection.report_info);
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              generalCondition: '',
              components: []
            }
          })
          .eq('id', reportId);
      } else {
        // Remove the room from additionalRooms
        const reportInfo = parseReportInfo(inspection.report_info);
          
        let additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
        
        additionalRooms = additionalRooms.filter((room: any) => room.id !== roomId);
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms: additionalRooms
            }
          })
          .eq('id', reportId);
          
        // Delete the actual room record
        await supabase
          .from('rooms')
          .delete()
          .eq('id', roomId);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }
};
