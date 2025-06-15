
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
  console.log(`🔍 [RESOLVE v5] Starting resolution with:`, {
    roomId,
    providedPropertyName: propertyName,
    providedRoomName: roomName
  });

  // If we already have both names provided and they're not generic, use them
  if (propertyName && roomName && 
      propertyName.trim() !== '' && roomName.trim() !== '' &&
      propertyName !== 'unknown_property' && roomName !== 'unknown_room' &&
      propertyName !== 'property' && roomName !== 'room' &&
      !propertyName.includes('error_') && !roomName.includes('error_')) {
    console.log(`✅ [RESOLVE v5] Using provided names:`, { propertyName, roomName });
    return { propertyName: propertyName.trim(), roomName: roomName.trim() };
  }

  // We need to fetch from database
  if (!roomId || !roomId.trim()) {
    console.error(`❌ [RESOLVE v5] Invalid roomId provided: "${roomId}"`);
    return { propertyName: "error_no_room_id", roomName: "error_no_room_id" };
  }

  if (!supabase) {
    console.error(`❌ [RESOLVE v5] Supabase client not available`);
    return { propertyName: "error_no_supabase", roomName: "error_no_supabase" };
  }

  try {
    console.log(`🔍 [RESOLVE v5] Fetching from database for roomId: ${roomId}`);
    
    // Fixed query structure - separate the join to avoid type inference issues
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        type,
        property_id
      `)
      .eq('id', roomId)
      .maybeSingle();

    if (roomError) {
      console.error(`❌ [RESOLVE v5] Room query error:`, roomError);
      return { propertyName: "error_room_query", roomName: "error_room_query" };
    }

    if (!roomData) {
      console.error(`❌ [RESOLVE v5] Room not found with ID: ${roomId}`);
      return { propertyName: "error_room_not_found", roomName: "error_room_not_found" };
    }

    console.log(`✅ [RESOLVE v5] Room data retrieved:`, roomData);

    // Fetch property data separately to avoid join issues
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        location,
        type
      `)
      .eq('id', roomData.property_id)
      .maybeSingle();

    if (propertyError) {
      console.error(`❌ [RESOLVE v5] Property query error:`, propertyError);
      return { propertyName: "error_property_query", roomName: roomData.name || "error_room_name" };
    }

    if (!propertyData) {
      console.error(`❌ [RESOLVE v5] Property not found with ID: ${roomData.property_id}`);
      return { propertyName: "error_property_not_found", roomName: roomData.name || "error_room_name" };
    }

    console.log(`✅ [RESOLVE v5] Property data retrieved:`, propertyData);

    // Resolve property name with priority: name > location > type > fallback
    let resolvedPropertyName = "unknown_property";
    if (propertyData.name && propertyData.name.trim() !== '') {
      resolvedPropertyName = propertyData.name.trim();
      console.log(`✅ [RESOLVE v5] Using property name: "${resolvedPropertyName}"`);
    } else if (propertyData.location && propertyData.location.trim() !== '') {
      resolvedPropertyName = propertyData.location.trim();
      console.log(`✅ [RESOLVE v5] Using property location as name: "${resolvedPropertyName}"`);
    } else if (propertyData.type && propertyData.type.trim() !== '') {
      resolvedPropertyName = propertyData.type.trim();
      console.log(`✅ [RESOLVE v5] Using property type as name: "${resolvedPropertyName}"`);
    } else {
      console.error(`❌ [RESOLVE v5] Property has no name, location, or type!`, propertyData);
      resolvedPropertyName = "property_no_name";
    }

    // FIXED: Resolve room name with STRICT priority - name is primary, never fallback to type unless name is truly empty
    let resolvedRoomName = "unknown_room";
    
    console.log(`🔍 [RESOLVE v5] Room name analysis:`, {
      rawName: roomData.name,
      nameExists: !!roomData.name,
      nameNotEmpty: roomData.name && roomData.name.trim() !== '',
      trimmedName: roomData.name ? roomData.name.trim() : null,
      roomType: roomData.type
    });

    if (roomData.name && roomData.name.trim() !== '') {
      resolvedRoomName = roomData.name.trim();
      console.log(`✅ [RESOLVE v5] Using room name: "${resolvedRoomName}"`);
    } else {
      console.warn(`⚠️ [RESOLVE v5] Room name is missing or empty! Raw name: "${roomData.name}", using type as fallback`);
      if (roomData.type && roomData.type.trim() !== '') {
        resolvedRoomName = roomData.type.trim().replace('_', ' ');
        console.log(`✅ [RESOLVE v5] Using room type as fallback name: "${resolvedRoomName}"`);
      } else {
        console.error(`❌ [RESOLVE v5] Room has no name or type!`, roomData);
        resolvedRoomName = "room_no_name";
      }
    }

    const result = {
      propertyName: resolvedPropertyName,
      roomName: resolvedRoomName
    };

    console.log(`✅ [RESOLVE v5] Final resolved names:`, result);
    
    // Enhanced success metrics
    const propertySuccess = resolvedPropertyName !== 'unknown_property' && !resolvedPropertyName.includes('error_');
    const roomSuccess = resolvedRoomName !== 'unknown_room' && !resolvedRoomName.includes('error_');
    
    console.log(`📊 [RESOLVE v5] Resolution analysis:`, {
      propertyName: resolvedPropertyName,
      propertySuccess,
      roomName: resolvedRoomName,
      roomSuccess,
      overallSuccess: propertySuccess && roomSuccess,
      usedProvidedNames: false,
      databaseLookupRequired: true
    });

    return result;
  } catch (error) {
    console.error(`❌ [RESOLVE v5] Exception during resolution:`, error);
    return { propertyName: "error_exception", roomName: "error_exception" };
  }
}
