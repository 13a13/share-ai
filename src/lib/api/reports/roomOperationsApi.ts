import { Room, RoomType, RoomImage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { uploadReportImage } from '@/utils/supabaseStorage';
import { parseReportInfo, formatRoomType } from './reportTransformers';

/**
 * API functions for room operations
 */
export const RoomOperationsAPI = {
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
        // Note: name isn't a column in the rooms table, we'll store it in the inspection's report_info
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
        name: name, // Use the name provided by the user
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
   * Update an existing room
   */
  updateRoom: async (reportId: string, roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    console.log("Updating room with:", { reportId, roomId, updates });
    
    try {
      // Get the inspection for the report
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (inspectionError) {
        console.error("Error fetching inspection:", inspectionError);
        return null;
      }
      
      // Check if this is the main room or an additional room
      const isMainRoom = inspection.room_id === roomId;
      
      if (isMainRoom) {
        // Update the room type if needed
        if (updates.type) {
          await supabase
            .from('rooms')
            .update({ type: updates.type })
            .eq('id', roomId);
        }
        
        // Update the room data in report_info
        const reportInfo = parseReportInfo(inspection.report_info);
        
        // Update the relevant fields
        const updatedReportInfo = {
          ...reportInfo,
          roomName: updates.name || reportInfo.roomName, // Store the room name
          generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : reportInfo.generalCondition,
          components: updates.components || reportInfo.components || [],
          sections: updates.sections || reportInfo.sections || []
        };
        
        await supabase
          .from('inspections')
          .update({ report_info: updatedReportInfo })
          .eq('id', reportId);
          
        // Get the room data
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();
          
        if (!room) {
          console.error("Room not found:", roomId);
          return null;
        }
        
        // Get images for the room
        const { data: imageData } = await supabase
          .from('inspection_images')
          .select('*')
          .eq('inspection_id', reportId);
          
        const roomImages = (imageData || []).map(img => ({
          id: img.id,
          url: img.image_url,
          timestamp: new Date(img.created_at),
          aiProcessed: img.analysis !== null,
          aiData: img.analysis
        }));
        
        // Use proper room name from reportInfo or format the room type if no name is available
        // Fix: Don't access the 'name' property on the room object since it doesn't exist
        const roomName = updatedReportInfo.roomName || formatRoomType(room.type);
        
        // Return the updated room
        return {
          id: roomId,
          name: roomName,
          type: room.type as RoomType,
          order: updates.order || 1,
          generalCondition: updatedReportInfo.generalCondition || '',
          sections: updatedReportInfo.sections || [],
          components: updatedReportInfo.components || [],
          images: roomImages
        };
      } else {
        // This is an additional room
        const reportInfo = parseReportInfo(inspection.report_info);
        
        const additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
        
        // Find the room in the additional rooms array
        const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
        
        if (roomIndex === -1) {
          console.error("Room not found in additional rooms:", roomId);
          return null;
        }
        
        // Update the room data
        additionalRooms[roomIndex] = {
          ...additionalRooms[roomIndex],
          name: updates.name || additionalRooms[roomIndex].name,
          type: updates.type || additionalRooms[roomIndex].type,
          generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : additionalRooms[roomIndex].generalCondition,
          components: updates.components || additionalRooms[roomIndex].components || []
        };
        
        // Update the room type in the rooms table if needed
        if (updates.type) {
          await supabase
            .from('rooms')
            .update({ type: updates.type })
            .eq('id', roomId);
        }
        
        // Update the inspection with the updated additional rooms
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms: additionalRooms
            }
          })
          .eq('id', reportId);
        
        // Get images for the room
        const { data: imageData } = await supabase
          .from('inspection_images')
          .select('*')
          .eq('inspection_id', reportId);
          
        const roomImages = (imageData || []).filter(img => 
          img.image_url.includes(`/${roomId}/`) || 
          (updates.components && updates.components.some(comp => 
            comp.images.some(image => image.url === img.image_url)
          ))
        ).map(img => ({
          id: img.id,
          url: img.image_url,
          timestamp: new Date(img.created_at),
          aiProcessed: img.analysis !== null,
          aiData: img.analysis
        }));

        // Use the name from additional rooms data or format type as fallback
        const roomName = additionalRooms[roomIndex].name || formatRoomType(additionalRooms[roomIndex].type);
        
        // Return the updated room
        return {
          id: roomId,
          name: roomName,
          type: additionalRooms[roomIndex].type as RoomType,
          order: updates.order || additionalRooms[roomIndex].order || roomIndex + 1,
          generalCondition: additionalRooms[roomIndex].generalCondition || '',
          sections: additionalRooms[roomIndex].sections || [],
          components: additionalRooms[roomIndex].components || [],
          images: roomImages
        };
      }
    } catch (error) {
      console.error("Error updating room:", error);
      return null;
    }
  },
  
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
