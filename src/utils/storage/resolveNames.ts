
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves property and room names given a roomId, with fallbacks and optional overrides.
 * Guarantees non-blank names for both property and room.
 */
export async function resolvePropertyAndRoomNames(
  roomId: string,
  propertyName?: string,
  roomName?: string
): Promise<{ propertyName: string; roomName: string }> {
  let prop = (propertyName && propertyName.trim()) ? propertyName : undefined;
  let room = (roomName && roomName.trim()) ? roomName : undefined;

  if ((!prop || !room) && roomId && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, property_id, properties(name)')
        .eq('id', roomId)
        .maybeSingle();
      if (data && !error) {
        if (!room) room = (data as any).name || (data as any).type || "room";
        if (!prop && (data as any).properties) prop = (data as any).properties.name || "property";
      }
    } catch (err) {
      // Fallback to defaults below
    }
  }
  if (!prop || prop.trim() === "") {
    console.warn(`⚠️ Could not resolve property name for roomId=${roomId}. Using "unknown_property"`);
    prop = "unknown_property";
  }
  if (!room || room.trim() === "") {
    console.warn(`⚠️ Could not resolve room name for roomId=${roomId}. Using "unknown_room"`);
    room = "unknown_room";
  }
  if (prop === "unknown_property" || room === "unknown_room") {
    console.error("🚨 FINAL WARNING from resolvePropertyAndRoomNames: Using dirty fallback values!", {
      roomId, propertyName, roomName, prop, room
    });
  }
  return {
    propertyName: prop && prop.trim() !== "" ? prop : "unknown_property",
    roomName: room && room.trim() !== "" ? room : "unknown_room"
  };
}
