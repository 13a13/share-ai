
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

    // Step 1: Fetch the inspection for the room id if not provided directly
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, room_id')
      .eq('id', reportId)
      .maybeSingle();

    if (inspectionError) {
      console.error('❌ Error fetching inspection:', inspectionError);
      throw new Error(`Failed to fetch inspection: ${inspectionError.message}`);
    }

    if (!inspection) {
      console.error('❌ No inspection found for reportId:', reportId);
      throw new Error(`No inspection found for reportId: ${reportId}`);
    }

    console.log('✅ Inspection data retrieved:', inspection);

    const actualRoomId = inspection.room_id;

    // Step 2: Get the room and property (try to fetch the room name, type, and the property's name)
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        type,
        name,
        property_id,
        properties!inner (
          id,
          name
        )
      `)
      .eq('id', actualRoomId)
      .maybeSingle();

    if (roomError) {
      console.error('❌ Error fetching room:', roomError);
      throw new Error(`Failed to fetch room: ${roomError.message}`);
    }

    if (!roomData || !roomData.properties) {
      console.error('❌ No room or property found for roomId:', actualRoomId, ', roomData:', roomData);
      throw new Error(`No room or property found for roomId: ${actualRoomId}`);
    }

    console.log('✅ Room and property data retrieved:', roomData);

    // Step 3: Get user account name for folder structure
    const userAccountName = await getUserAccountName();

    // Use the property name as is from DB (or fallback)
    let propertyName = (roomData.properties.name && roomData.properties.name.trim() !== "")
      ? roomData.properties.name
      : null;

    // Use the room "name" field if present, otherwise fallback to type
    let roomName = (roomData.name && roomData.name.trim() !== "")
      ? roomData.name
      : (roomData.type || null);

    // For type, fall back to 'unknown_room' ONLY if all else fails
    let roomType = roomData.type || 'unknown_room';

    if (!propertyName) {
      propertyName = "unknown_property";
      console.warn(`⚠️ propertyName fetched from DB is missing or blank for property_id: ${roomData.property_id}`);
    }
    if (!roomName) {
      roomName = "unknown_room";
      console.warn(`⚠️ roomName fetched from DB is missing or blank for room_id: ${actualRoomId}`);
    }

    // Clean names for folder usage
    const cleanedPropertyName = cleanNameForFolder(propertyName);
    const cleanedRoomName = cleanNameForFolder(roomName);

    const result = {
      propertyName: cleanedPropertyName,
      roomName: cleanedRoomName,
      roomType: roomType,
      propertyId: roomData.property_id,
      roomId: actualRoomId,
      userAccountName: userAccountName
    };

    console.log('🏠 Final property and room info for folder generation:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    throw new Error(`Could not fetch property/room info: ${error.message}`);
  }
}

