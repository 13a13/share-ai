
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface PropertyRoomInfo {
  propertyName: string;
  roomName: string;
  roomType: string;
}

/**
 * Fetch property and room information from the database
 */
export async function getPropertyAndRoomInfo(reportId: string, roomId?: string): Promise<PropertyRoomInfo> {
  try {
    console.log(`🔍 Fetching property and room info for reportId: ${reportId}, roomId: ${roomId}`);
    
    // First, get the inspection to find the room_id
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, room_id')
      .eq('id', reportId)
      .single();

    if (inspectionError) {
      console.error('❌ Error fetching inspection:', inspectionError);
      throw new Error(`Failed to fetch inspection: ${inspectionError.message}`);
    }

    if (!inspection) {
      console.error('❌ No inspection found for reportId:', reportId);
      throw new Error(`No inspection found for reportId: ${reportId}`);
    }

    console.log('✅ Inspection data retrieved:', inspection);

    // Use the roomId from the inspection
    const actualRoomId = inspection.room_id;
    
    // Now get the room and property information
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        type,
        property_id,
        properties (
          id,
          name
        )
      `)
      .eq('id', actualRoomId)
      .single();

    if (roomError) {
      console.error('❌ Error fetching room:', roomError);
      throw new Error(`Failed to fetch room: ${roomError.message}`);
    }

    if (!roomData) {
      console.error('❌ No room found for roomId:', actualRoomId);
      throw new Error(`No room found for roomId: ${actualRoomId}`);
    }

    console.log('✅ Room data retrieved:', roomData);

    const propertyName = roomData.properties?.name || 'unknown_property';
    const roomType = roomData.type || 'unknown_room';
    
    // Generate a clean room name based on room type
    const roomName = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      propertyName: cleanNameForFolder(propertyName),
      roomName: cleanNameForFolder(roomName),
      roomType: roomType
    };

    console.log('🏠 Final property and room info:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    
    // Enhanced fallback: try to get minimal info if main query fails
    try {
      console.log('🔄 Attempting fallback query...');
      
      const { data: fallbackInspection } = await supabase
        .from('inspections')
        .select('room_id')
        .eq('id', reportId)
        .single();
      
      if (fallbackInspection?.room_id) {
        const { data: fallbackRoom } = await supabase
          .from('rooms')
          .select('type, properties(name)')
          .eq('id', fallbackInspection.room_id)
          .single();
        
        if (fallbackRoom) {
          console.log('✅ Fallback data retrieved:', fallbackRoom);
          return {
            propertyName: cleanNameForFolder(fallbackRoom.properties?.name || 'property'),
            roomName: cleanNameForFolder(fallbackRoom.type || 'room'),
            roomType: fallbackRoom.type || 'room'
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback query also failed:', fallbackError);
    }
    
    // Final fallback values
    return {
      propertyName: 'unknown_property',
      roomName: 'unknown_room',
      roomType: 'unknown_room'
    };
  }
}

/**
 * Clean names for folder structure (remove special characters)
 */
function cleanNameForFolder(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  console.log(`🧹 Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned;
}
