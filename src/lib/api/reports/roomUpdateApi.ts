
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
    console.log("🔧 RoomUpdateAPI.updateRoom called with:", { reportId, roomId, updates });
    
    try {
      // Get the inspection for the report
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (inspectionError) {
        console.error("❌ Error fetching inspection:", inspectionError);
        return null;
      }
      
      console.log("📊 Inspection data:", { 
        inspectionId: inspection.id, 
        mainRoomId: inspection.room_id, 
        targetRoomId: roomId 
      });
      
      // Improved room classification logic
      const isMainRoom = inspection.room_id === roomId;
      
      console.log(`🏠 Room classification: ${isMainRoom ? 'MAIN' : 'ADDITIONAL'} room`);
      
      if (isMainRoom) {
        return await updateMainRoom(inspection, roomId, reportId, updates);
      } else {
        return await updateAdditionalRoom(inspection, roomId, reportId, updates);
      }
    } catch (error) {
      console.error("❌ Error updating room:", error);
      return null;
    }
  }
};

/**
 * Update the main room of an inspection
 */
async function updateMainRoom(inspection: any, roomId: string, reportId: string, updates: Partial<Room>): Promise<Room | null> {
  console.log("🏠 Updating MAIN room with components:", updates.components?.length || 0);
  
  // Update the room type if needed
  if (updates.type) {
    await supabase
      .from('rooms')
      .update({ type: updates.type })
      .eq('id', roomId);
  }
  
  // Update the room data in report_info using improved defensive pattern
  const reportInfo = parseReportInfo(inspection.report_info);
  
  const updatedReportInfo = {
    ...reportInfo,
    roomName: updates.name !== undefined ? updates.name : reportInfo.roomName,
    generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : reportInfo.generalCondition,
    components: updates.components !== undefined ? updates.components : reportInfo.components || [],
    sections: updates.sections !== undefined ? updates.sections : reportInfo.sections || []
  };
  
  console.log("💾 Saving MAIN room components:", updatedReportInfo.components.length);
  
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
 * Update an additional room in the inspection - FIXED VERSION
 */
async function updateAdditionalRoom(inspection: any, roomId: string, reportId: string, updates: Partial<Room>): Promise<Room | null> {
  console.log("🏠 Updating ADDITIONAL room with components:", updates.components?.length || 0);
  
  const reportInfo = parseReportInfo(inspection.report_info);
  const additionalRooms = Array.isArray(reportInfo.additionalRooms) 
    ? reportInfo.additionalRooms 
    : [];
  
  let roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
  
  if (roomIndex === -1) {
    console.log("➕ Creating new ADDITIONAL room entry for:", roomId);
    
    // Get the room type from the rooms table
    const { data: roomData } = await supabase
      .from('rooms')
      .select('type, name')
      .eq('id', roomId)
      .single();
    
    if (!roomData) {
      console.error("❌ Room not found in rooms table:", roomId);
      return null;
    }
    
    // Create new room entry with PROPER component handling
    const newRoomEntry = {
      id: roomId,
      name: updates.name !== undefined ? updates.name : (roomData.name || formatRoomType(roomData.type)),
      type: updates.type !== undefined ? updates.type : roomData.type,
      generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : '',
      components: updates.components !== undefined ? updates.components : [], // ✅ FIXED: Always ensure array
      sections: updates.sections !== undefined ? updates.sections : [],
      order: additionalRooms.length + 2
    };
    
    console.log("✅ New room entry created with components:", newRoomEntry.components.length);
    
    additionalRooms.push(newRoomEntry);
    roomIndex = additionalRooms.length - 1;
  } else {
    console.log("📝 Updating existing ADDITIONAL room entry");
    
    // Update existing room data using CONSISTENT defensive pattern
    additionalRooms[roomIndex] = {
      ...additionalRooms[roomIndex],
      name: updates.name !== undefined ? updates.name : additionalRooms[roomIndex].name,
      type: updates.type !== undefined ? updates.type : additionalRooms[roomIndex].type,
      generalCondition: updates.generalCondition !== undefined ? updates.generalCondition : additionalRooms[roomIndex].generalCondition,
      components: updates.components !== undefined ? updates.components : (additionalRooms[roomIndex].components || []), // ✅ FIXED: Consistent pattern
      sections: updates.sections !== undefined ? updates.sections : (additionalRooms[roomIndex].sections || []),
      order: updates.order !== undefined ? updates.order : (additionalRooms[roomIndex].order || roomIndex + 2)
    };
  }
  
  console.log("💾 Saving ADDITIONAL room components:", additionalRooms[roomIndex].components.length);
  
  // Update the room type in the rooms table if needed
  if (updates.type) {
    await supabase
      .from('rooms')
      .update({ type: updates.type })
      .eq('id', roomId);
  }
  
  // Update the room name in the rooms table if needed
  if (updates.name) {
    await supabase
      .from('rooms')
      .update({ name: updates.name })
      .eq('id', roomId);
  }
  
  // Update the inspection with the updated additional rooms
  const updatedReportInfo = {
    ...reportInfo,
    additionalRooms: additionalRooms
  };
  
  await supabase
    .from('inspections')
    .update({
      report_info: updatedReportInfo
    })
    .eq('id', reportId);
  
  // Get images for the room
  const { data: imageData } = await supabase
    .from('inspection_images')
    .select('*')
    .eq('inspection_id', reportId);
    
  const roomImages = (imageData || []).filter(img => 
    img.image_url.includes(`/${roomId}/`) || 
    (additionalRooms[roomIndex].components && additionalRooms[roomIndex].components.some((comp: any) => 
      comp.images && comp.images.some((image: any) => image.url === img.image_url)
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
    order: additionalRooms[roomIndex].order || roomIndex + 2,
    generalCondition: additionalRooms[roomIndex].generalCondition || '',
    sections: additionalRooms[roomIndex].sections || [],
    components: additionalRooms[roomIndex].components || [],
    images: roomImages
  };
}
