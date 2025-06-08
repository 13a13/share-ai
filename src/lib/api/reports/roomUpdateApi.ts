
import { Room, RoomType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseReportInfo, formatRoomType } from './reportTransformers';

/**
 * API functions for updating room data
 */
export const RoomUpdateAPI = {
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
        return await updateMainRoom(inspection, roomId, reportId, updates);
      } else {
        return await updateAdditionalRoom(inspection, roomId, reportId, updates);
      }
    } catch (error) {
      console.error("Error updating room:", error);
      return null;
    }
  }
};

/**
 * Update the main room of an inspection
 */
async function updateMainRoom(inspection: any, roomId: string, reportId: string, updates: Partial<Room>): Promise<Room | null> {
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
    roomName: updates.name || reportInfo.roomName,
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
  
  const roomName = updatedReportInfo.roomName || formatRoomType(room.type);
  
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
}

/**
 * Update an additional room in the inspection
 */
async function updateAdditionalRoom(inspection: any, roomId: string, reportId: string, updates: Partial<Room>): Promise<Room | null> {
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

  const roomName = additionalRooms[roomIndex].name || formatRoomType(additionalRooms[roomIndex].type);
  
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
