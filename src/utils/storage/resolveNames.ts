
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves property and room names given a roomId, with robust fallbacks and schema compatibility.
 * This version is designed to work with the actual database schema.
 */
export async function resolvePropertyAndRoomNames(
  roomId: string,
  propertyName?: string,
  roomName?: string
): Promise<{ propertyName: string; roomName: string }> {
  console.log(`🔍 resolvePropertyAndRoomNames called with:`, {
    roomId,
    providedPropertyName: propertyName,
    providedRoomName: roomName
  });

  let resolvedProp = (propertyName && propertyName.trim()) ? propertyName : undefined;
  let resolvedRoom = (roomName && roomName.trim()) ? roomName : undefined;

  // Only fetch from database if we're missing either name
  if ((!resolvedProp || !resolvedRoom) && roomId && supabase) {
    try {
      console.log(`🔍 Fetching room and property data from database for roomId: ${roomId}`);
      
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id, 
          name, 
          type,
          property_id,
          properties (
            id,
            name,
            location,
            type
          )
        `)
        .eq('id', roomId)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error fetching room data:', error);
      } else if (data) {
        console.log('✅ Successfully fetched room data:', {
          roomId: data.id,
          roomName: data.name,
          roomType: data.type,
          propertyId: data.property_id,
          propertyData: data.properties
        });

        // Resolve room name with multiple fallbacks
        if (!resolvedRoom) {
          if (data.name && data.name.trim() !== '') {
            resolvedRoom = data.name;
            console.log(`✅ Using room name from database: "${resolvedRoom}"`);
          } else if (data.type && data.type.trim() !== '') {
            resolvedRoom = data.type.replace('_', ' ');
            console.log(`✅ Using room type as name: "${resolvedRoom}"`);
          } else {
            resolvedRoom = "room";
            console.log(`⚠️ No room name or type found, using default: "${resolvedRoom}"`);
          }
        }

        // Resolve property name with multiple fallbacks
        if (!resolvedProp && data.properties) {
          const propertyData = data.properties as any;
          if (propertyData.name && propertyData.name.trim() !== '') {
            resolvedProp = propertyData.name;
            console.log(`✅ Using property name from database: "${resolvedProp}"`);
          } else if (propertyData.location && propertyData.location.trim() !== '') {
            resolvedProp = propertyData.location;
            console.log(`✅ Using property location as name: "${resolvedProp}"`);
          } else if (propertyData.type && propertyData.type.trim() !== '') {
            resolvedProp = propertyData.type;
            console.log(`✅ Using property type as name: "${resolvedProp}"`);
          } else {
            resolvedProp = "property";
            console.log(`⚠️ No property name, location, or type found, using default: "${resolvedProp}"`);
          }
        }
      } else {
        console.warn(`⚠️ No room found with ID: ${roomId}`);
      }
    } catch (err) {
      console.error('❌ Exception while fetching room/property data:', err);
    }
  }

  // Final fallback validation
  if (!resolvedProp || resolvedProp.trim() === "") {
    console.warn(`⚠️ Property name resolution failed for roomId=${roomId}. Using "property"`);
    resolvedProp = "property";
  }
  if (!resolvedRoom || resolvedRoom.trim() === "") {
    console.warn(`⚠️ Room name resolution failed for roomId=${roomId}. Using "room"`);
    resolvedRoom = "room";
  }

  const result = {
    propertyName: resolvedProp,
    roomName: resolvedRoom
  };

  console.log(`✅ Final resolved names:`, result);
  
  // Log warning if we're still using generic names
  if (resolvedProp === "property" || resolvedRoom === "room") {
    console.error("🚨 RESOLUTION WARNING: Using generic fallback names!", {
      roomId, 
      originalPropertyName: propertyName, 
      originalRoomName: roomName, 
      finalResult: result
    });
  }

  return result;
}
