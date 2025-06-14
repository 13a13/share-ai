
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getUserAccountName, cleanNameForFolder } from './user-utils.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface PropertyRoomInfo {
  propertyName: string;
  roomName: string;
  roomType: string;
  propertyId: string;
  roomId: string;
  userAccountName: string;
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
    
    // Now get the room and property information with a comprehensive query
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        type,
        property_id,
        properties!inner (
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

    if (!roomData || !roomData.properties) {
      console.error('❌ No room or property found for roomId:', actualRoomId);
      throw new Error(`No room or property found for roomId: ${actualRoomId}`);
    }

    console.log('✅ Room and property data retrieved:', roomData);

    // Get user account name for folder structure
    const userAccountName = await getUserAccountName();

    const propertyName = roomData.properties.name || 'Unknown Property';
    const roomType = roomData.type || 'unknown_room';
    
    // Generate a clean room name based on room type
    const roomName = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      propertyName: cleanNameForFolder(propertyName),
      roomName: cleanNameForFolder(roomName),
      roomType: roomType,
      propertyId: roomData.property_id,
      roomId: actualRoomId,
      userAccountName: userAccountName
    };

    console.log('🏠 Final property and room info:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    throw new Error(`Could not fetch property/room info: ${error.message}`);
  }
}
