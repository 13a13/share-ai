
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
      const reportInfo = parseReportInfo(inspection.report_info);
      let additionalRooms = Array.isArray(reportInfo.additionalRooms)
        ? reportInfo.additionalRooms
        : [];

      if (inspection.room_id === roomId) {
        // Deleting the main room: promote another room or create a placeholder
        if (additionalRooms.length > 0) {
          const newMain = additionalRooms[0];

          await supabase
            .from('inspections')
            .update({
              room_id: newMain.id,
              report_info: {
                ...reportInfo,
                name: newMain.name,
                type: newMain.type,
                generalCondition: newMain.generalCondition || '',
                components: newMain.components || [],
                additionalRooms: additionalRooms.filter((r: any) => r.id !== newMain.id)
              }
            })
            .eq('id', reportId);
        } else {
          // No additional rooms: create a placeholder room and reset report info
          const { data: currentRoom } = await supabase
            .from('rooms')
            .select('property_id')
            .eq('id', roomId)
            .single();

          const newRoomId = crypto.randomUUID();

          if (currentRoom?.property_id) {
            await supabase.from('rooms').insert({
              id: newRoomId,
              property_id: currentRoom.property_id,
              type: 'room',
            });
          }

          await supabase
            .from('inspections')
            .update({
              room_id: newRoomId,
              report_info: {
                ...reportInfo,
                generalCondition: '',
                components: [],
                additionalRooms: []
              }
            })
            .eq('id', reportId);
        }

        // Delete the old main room record
        await supabase
          .from('rooms')
          .delete()
          .eq('id', roomId);
      } else {
        // Remove the room from additionalRooms and delete the record
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
