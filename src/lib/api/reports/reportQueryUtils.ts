
import { Report, Room } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper functions for processing and fetching report data
 */

/**
 * Process main room for a report
 */
export const processMainRoom = async (reportId: string, room: any, reportInfo: any, formatRoomType: (type: string) => string) => {
  // Add main room
  const mainRoom = {
    id: room.id,
    name: reportInfo.roomName || formatRoomType(room.type), // Use stored name or format type
    type: room.type as any,
    order: 0,
    generalCondition: reportInfo.generalCondition || '',
    sections: reportInfo.sections || [],
    components: reportInfo.components || [],
    images: []
  };
  
  // Get images for main room
  const { data: imageData } = await supabase
    .from('inspection_images')
    .select('*')
    .eq('inspection_id', reportId);
  
  const mainRoomImages = (imageData || [])
    .filter(img => !img.image_url.includes('/') || img.image_url.includes(`/${room.id}/`))
    .map(img => ({
      id: img.id,
      url: img.image_url,
      timestamp: new Date(img.created_at),
      aiProcessed: img.analysis !== null,
      aiData: img.analysis
    }));
  
  mainRoom.images = mainRoomImages;
  
  return mainRoom;
};

/**
 * Process additional rooms for a report
 */
export const processAdditionalRooms = async (reportId: string, reportInfo: any) => {
  const additionalRooms = [];
  
  if (reportInfo.additionalRooms && Array.isArray(reportInfo.additionalRooms)) {
    for (const additionalRoom of reportInfo.additionalRooms) {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', additionalRoom.id)
        .single();
        
      if (!roomData) continue;
      
      // Use the name from additional rooms data or format type as fallback
      const { formatRoomType } = await import('./reportTransformers');
      const roomName = additionalRoom.name || formatRoomType(additionalRoom.type);
      
      // Get images for this room
      const { data: imageData } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_id', reportId);
      
      additionalRooms.push({
        id: additionalRoom.id,
        name: roomName,
        type: roomData.type as any,
        order: additionalRoom.order || additionalRooms.length + 1,
        generalCondition: additionalRoom.generalCondition || '',
        sections: additionalRoom.sections || [],
        components: additionalRoom.components || [],
        images: (imageData || [])
          .filter(img => img.image_url.includes(`/${additionalRoom.id}/`))
          .map(img => ({
            id: img.id,
            url: img.image_url,
            timestamp: new Date(img.created_at),
            aiProcessed: img.analysis !== null,
            aiData: img.analysis
          }))
      });
    }
  }
  
  return additionalRooms;
};

/**
 * Fetch room by ID
 */
export const getRoomById = async (roomId: string): Promise<any | null> => {
  try {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }
    
    return room;
  } catch (error) {
    console.error('Error in getRoomById:', error);
    return null;
  }
};

/**
 * Fetch property by ID
 */
export const getPropertyById = async (propertyId: string): Promise<any | null> => {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    
    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }
    
    return property;
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    return null;
  }
};

/**
 * Fetch all rooms for a property
 */
export const getRoomsByPropertyId = async (propertyId: string): Promise<any[] | null> => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id')
      .eq('property_id', propertyId);
      
    if (error) {
      console.error('Error fetching rooms:', error);
      return null;
    }
    
    return rooms;
  } catch (error) {
    console.error('Error in getRoomsByPropertyId:', error);
    return null;
  }
};

/**
 * Fetch inspections by room IDs
 */
export const getInspectionsByRoomIds = async (roomIds: string[]): Promise<any[] | null> => {
  try {
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching inspections:', error);
      return null;
    }
    
    return inspections;
  } catch (error) {
    console.error('Error in getInspectionsByRoomIds:', error);
    return null;
  }
};

/**
 * Fetch images for an inspection
 */
export const getImagesForInspection = async (inspectionId: string): Promise<any[] | null> => {
  try {
    const { data: imageData, error } = await supabase
      .from('inspection_images')
      .select('*')
      .eq('inspection_id', inspectionId);
    
    if (error) {
      console.error('Error fetching images:', error);
      return null;
    }
    
    return imageData || [];
  } catch (error) {
    console.error('Error in getImagesForInspection:', error);
    return null;
  }
};
