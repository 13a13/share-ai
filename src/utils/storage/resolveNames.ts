
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
  console.log(`🔍 [RESOLVE v4] Starting resolution with:`, {
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
    console.log(`✅ [RESOLVE v4] Using provided names:`, { propertyName, roomName });
    return { propertyName: propertyName.trim(), roomName: roomName.trim() };
  }

  // We need to fetch from database
  if (!roomId || !roomId.trim()) {
    console.error(`❌ [RESOLVE v4] Invalid roomId provided: "${roomId}"`);
    return { propertyName: "error_no_room_id", roomName: "error_no_room_id" };
  }

  if (!supabase) {
    console.error(`❌ [RESOLVE v4] Supabase client not available`);
    return { propertyName: "error_no_supabase", roomName: "error_no_supabase" };
  }

  try {
    console.log(`🔍 [RESOLVE v4] Fetching from database for roomId: ${roomId}`);
    
    // Enhanced query with join to get all data in one call
    const { data: roomWithProperty, error: queryError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        type,
        property_id,
        properties!inner (
          id,
          name,
          location,
          type
        )
      `)
      .eq('id', roomId)
      .maybeSingle();

    if (queryError) {
      console.error(`❌ [RESOLVE v4] Database query error:`, queryError);
      return { propertyName: "error_query_failed", roomName: "error_query_failed" };
    }

    if (!roomWithProperty) {
      console.error(`❌ [RESOLVE v4] Room not found with ID: ${roomId}`);
      return { propertyName: "error_room_not_found", roomName: "error_room_not_found" };
    }

    console.log(`✅ [RESOLVE v4] Raw database result:`, JSON.stringify(roomWithProperty, null, 2));

    // Extract property data
    const propertyData = roomWithProperty.properties;
    if (!propertyData) {
      console.error(`❌ [RESOLVE v4] Property data missing from room query`);
      return { propertyName: "error_property_missing", roomName: roomWithProperty.name || "error_room_name" };
    }

    // Resolve property name with priority: name > location > type > fallback
    let resolvedPropertyName = "unknown_property";
    if (propertyData.name && propertyData.name.trim() !== '') {
      resolvedPropertyName = propertyData.name.trim();
      console.log(`✅ [RESOLVE v4] Using property name: "${resolvedPropertyName}"`);
    } else if (propertyData.location && propertyData.location.trim() !== '') {
      resolvedPropertyName = propertyData.location.trim();
      console.log(`✅ [RESOLVE v4] Using property location as name: "${resolvedPropertyName}"`);
    } else if (propertyData.type && propertyData.type.trim() !== '') {
      resolvedPropertyName = propertyData.type.trim();
      console.log(`✅ [RESOLVE v4] Using property type as name: "${resolvedPropertyName}"`);
    } else {
      console.error(`❌ [RESOLVE v4] Property has no name, location, or type!`, propertyData);
      resolvedPropertyName = "property_no_name";
    }

    // FIXED: Resolve room name with STRICT priority - name is primary, never fallback to type unless name is truly empty
    let resolvedRoomName = "unknown_room";
    
    console.log(`🔍 [RESOLVE v4] Room name analysis:`, {
      rawName: roomWithProperty.name,
      nameExists: !!roomWithProperty.name,
      nameNotEmpty: roomWithProperty.name && roomWithProperty.name.trim() !== '',
      trimmedName: roomWithProperty.name ? roomWithProperty.name.trim() : null,
      roomType: roomWithProperty.type
    });

    if (roomWithProperty.name && roomWithProperty.name.trim() !== '') {
      resolvedRoomName = roomWithProperty.name.trim();
      console.log(`✅ [RESOLVE v4] Using room name: "${resolvedRoomName}"`);
    } else {
      console.warn(`⚠️ [RESOLVE v4] Room name is missing or empty! Raw name: "${roomWithProperty.name}", using type as fallback`);
      if (roomWithProperty.type && roomWithProperty.type.trim() !== '') {
        resolvedRoomName = roomWithProperty.type.trim().replace('_', ' ');
        console.log(`✅ [RESOLVE v4] Using room type as fallback name: "${resolvedRoomName}"`);
      } else {
        console.error(`❌ [RESOLVE v4] Room has no name or type!`, roomWithProperty);
        resolvedRoomName = "room_no_name";
      }
    }

    const result = {
      propertyName: resolvedPropertyName,
      roomName: resolvedRoomName
    };

    console.log(`✅ [RESOLVE v4] Final resolved names:`, result);
    
    // Enhanced success metrics
    const propertySuccess = resolvedPropertyName !== 'unknown_property' && !resolvedPropertyName.includes('error_');
    const roomSuccess = resolvedRoomName !== 'unknown_room' && !resolvedRoomName.includes('error_');
    
    console.log(`📊 [RESOLVE v4] Resolution analysis:`, {
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
    console.error(`❌ [RESOLVE v4] Exception during resolution:`, error);
    return { propertyName: "error_exception", roomName: "error_exception" };
  }
}
