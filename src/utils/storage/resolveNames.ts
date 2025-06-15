
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves property and room names given a roomId, with comprehensive debugging and validation.
 * This version ensures we always get the correct names or fail with detailed error information.
 */
export async function resolvePropertyAndRoomNames(
  roomId: string,
  propertyName?: string,
  roomName?: string
): Promise<{ propertyName: string; roomName: string }> {
  console.log(`🔍 [RESOLVE v3] Starting resolution with:`, {
    roomId,
    providedPropertyName: propertyName,
    providedRoomName: roomName
  });

  // If we already have both names provided and they're not generic, use them
  if (propertyName && roomName && 
      propertyName.trim() !== '' && roomName.trim() !== '' &&
      propertyName !== 'unknown_property' && roomName !== 'unknown_room' &&
      propertyName !== 'property' && roomName !== 'room') {
    console.log(`✅ [RESOLVE v3] Using provided names:`, { propertyName, roomName });
    return { propertyName: propertyName.trim(), roomName: roomName.trim() };
  }

  // We need to fetch from database
  if (!roomId || !roomId.trim()) {
    console.error(`❌ [RESOLVE v3] Invalid roomId provided: "${roomId}"`);
    return { propertyName: "error_no_room_id", roomName: "error_no_room_id" };
  }

  if (!supabase) {
    console.error(`❌ [RESOLVE v3] Supabase client not available`);
    return { propertyName: "error_no_supabase", roomName: "error_no_supabase" };
  }

  try {
    console.log(`🔍 [RESOLVE v3] Fetching from database for roomId: ${roomId}`);
    
    // First, let's check if the room exists at all
    const { data: roomCheck, error: roomCheckError } = await supabase
      .from('rooms')
      .select('id, name, type, property_id')
      .eq('id', roomId)
      .maybeSingle();

    if (roomCheckError) {
      console.error(`❌ [RESOLVE v3] Room check query error:`, roomCheckError);
      return { propertyName: "error_room_query", roomName: "error_room_query" };
    }

    if (!roomCheck) {
      console.error(`❌ [RESOLVE v3] Room not found with ID: ${roomId}`);
      return { propertyName: "error_room_not_found", roomName: "error_room_not_found" };
    }

    console.log(`✅ [RESOLVE v3] Room found:`, roomCheck);

    // Now fetch the property information
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, location, type')
      .eq('id', roomCheck.property_id)
      .maybeSingle();

    if (propertyError) {
      console.error(`❌ [RESOLVE v3] Property query error:`, propertyError);
      return { propertyName: "error_property_query", roomName: roomCheck.name || roomCheck.type || "room" };
    }

    if (!propertyData) {
      console.error(`❌ [RESOLVE v3] Property not found with ID: ${roomCheck.property_id}`);
      return { propertyName: "error_property_not_found", roomName: roomCheck.name || roomCheck.type || "room" };
    }

    console.log(`✅ [RESOLVE v3] Property found:`, propertyData);

    // Resolve property name with priority: name > location > type > fallback
    let resolvedPropertyName = "unknown_property";
    if (propertyData.name && propertyData.name.trim() !== '') {
      resolvedPropertyName = propertyData.name.trim();
      console.log(`✅ [RESOLVE v3] Using property name: "${resolvedPropertyName}"`);
    } else if (propertyData.location && propertyData.location.trim() !== '') {
      resolvedPropertyName = propertyData.location.trim();
      console.log(`✅ [RESOLVE v3] Using property location as name: "${resolvedPropertyName}"`);
    } else if (propertyData.type && propertyData.type.trim() !== '') {
      resolvedPropertyName = propertyData.type.trim();
      console.log(`✅ [RESOLVE v3] Using property type as name: "${resolvedPropertyName}"`);
    } else {
      console.error(`❌ [RESOLVE v3] Property has no name, location, or type!`, propertyData);
      resolvedPropertyName = "property_no_name";
    }

    // Resolve room name with priority: name > type > fallback
    let resolvedRoomName = "unknown_room";
    if (roomCheck.name && roomCheck.name.trim() !== '') {
      resolvedRoomName = roomCheck.name.trim();
      console.log(`✅ [RESOLVE v3] Using room name: "${resolvedRoomName}"`);
    } else if (roomCheck.type && roomCheck.type.trim() !== '') {
      resolvedRoomName = roomCheck.type.trim().replace('_', ' ');
      console.log(`✅ [RESOLVE v3] Using room type as name: "${resolvedRoomName}"`);
    } else {
      console.error(`❌ [RESOLVE v3] Room has no name or type!`, roomCheck);
      resolvedRoomName = "room_no_name";
    }

    const result = {
      propertyName: resolvedPropertyName,
      roomName: resolvedRoomName
    };

    console.log(`✅ [RESOLVE v3] Final resolved names:`, result);
    
    // Log success metrics
    console.log(`📊 [RESOLVE v3] Resolution success: Property="${resolvedPropertyName}" (${resolvedPropertyName === 'unknown_property' ? 'FAILED' : 'SUCCESS'}), Room="${resolvedRoomName}" (${resolvedRoomName === 'unknown_room' ? 'FAILED' : 'SUCCESS'})`);

    return result;
  } catch (error) {
    console.error(`❌ [RESOLVE v3] Exception during resolution:`, error);
    return { propertyName: "error_exception", roomName: "error_exception" };
  }
}
