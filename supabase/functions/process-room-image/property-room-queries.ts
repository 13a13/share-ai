
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
 * Fetch property and room information from the database with advanced debugging/fallbacks.
 */
export async function getPropertyAndRoomInfo(reportId: string, roomId?: string): Promise<PropertyRoomInfo> {
  try {
    console.log(`🔍 [DEBUG v2] Fetching property/room info for reportId: ${reportId}, roomId: ${roomId || '[not supplied]'}`);

    // Step 1: Always fetch inspection for latest room id
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
    const actualRoomId = inspection.room_id;
    console.log('[DEBUG] Inspection retrieved:', JSON.stringify(inspection));

    // Step 2: Try to fetch room with name/type and related property name
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        type,
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
    if (!roomData) {
      console.error('❌ No room found for id:', actualRoomId);
      throw new Error(`No room found for roomId: ${actualRoomId}`);
    }
    console.log('[DEBUG] Raw roomData:', JSON.stringify(roomData));

    // Fallback: If joined .properties is missing, fetch property separately
    let propertyName: string|null = null;
    let propertyId = roomData.property_id;
    if (roomData.properties && roomData.properties.name && roomData.properties.name.trim() !== "") {
      propertyName = roomData.properties.name;
    } else {
      // extra check: fallback query for property name
      if (!propertyName) {
        const { data: propSolo, error: propError } = await supabase
          .from('properties')
          .select('id, name')
          .eq('id', propertyId)
          .maybeSingle();
        if (propError) {
          console.error(`[DEBUG] Property fallback query error for id=${propertyId}:`, propError);
        }
        if (propSolo && propSolo.name && propSolo.name.trim() !== "") {
          propertyName = propSolo.name;
          console.log(`[DEBUG] Fallback got property name: "${propertyName}"`);
        }
      }
      if (!propertyName) {
        propertyName = "unknown_property";
        console.warn(`⚠️ propertyName missing or blank for property_id: ${propertyId}`);
      }
    }

    // Smart logic: prefer .name, fallback to .type, else unknown
    let roomName: string|null = null;
    if (roomData.name && roomData.name.trim() !== "") {
      roomName = roomData.name;
    } else if (roomData.type && roomData.type.trim() !== "") {
      roomName = roomData.type;
      console.warn(`⚠️ Room name missing; falling back to type: "${roomData.type}"`);
    } else {
      roomName = "unknown_room";
      console.warn(`⚠️ No name or type found for room id: ${actualRoomId}`);
    }

    let roomType: string = (roomData.type && roomData.type.trim() !== "") ? roomData.type : 'unknown_room';

    // Step 3: Get user account name
    const userAccountName = await getUserAccountName();

    // Cleaning for folders (also logged in utils)
    const cleanedPropertyName = cleanNameForFolder(propertyName);
    const cleanedRoomName = cleanNameForFolder(roomName);

    const result: PropertyRoomInfo = {
      propertyName: cleanedPropertyName,
      roomName: cleanedRoomName,
      roomType: roomType,
      propertyId: propertyId,
      roomId: actualRoomId,
      userAccountName
    };

    // Super debug output for end-to-end tracing
    console.log('[DEBUG] Final PropertyRoomInfo:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    throw new Error(`Could not fetch property/room info: ${error.message}`);
  }
}
