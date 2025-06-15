
import { v4 as uuidv4 } from 'uuid';
import { getUserFullName } from './userUtils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean names for folder structure (remove special characters)
 */
export const cleanNameForFolder = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  console.log(`🧹 Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned;
};

/**
 * Utility to fetch property/room name by id if missing
 */
async function resolveNamesIfMissing(reportId: string, roomId: string, propertyName?: string, roomName?: string) {
  let prop = propertyName && propertyName.trim() !== '' ? propertyName : undefined;
  let room = roomName && roomName.trim() !== '' ? roomName : undefined;

  if ((!prop || !room) && roomId && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type, property_id, properties(name)')
        .eq('id', roomId)
        .maybeSingle();
      if (data && !error) {
        if (!room) {
          room = (data as any).name ?? (data as any).type ?? "";
        }
        if (!prop && (data as any).properties) {
          prop = (data as any).properties.name ?? "";
        }
      }
    } catch (err) {
      console.error("❌ Error resolving names in resolveNamesIfMissing:", err);
    }
  }

  // Log exactly what is being returned, and warn if defaults are used.
  if (!prop || prop.trim() === "") {
    console.warn(`⚠️ Could not resolve property name for roomId=${roomId}, reportId=${reportId}. Falling back to "unknown_property"`);
    prop = "unknown_property";
  }
  if (!room || room.trim() === "") {
    console.warn(`⚠️ Could not resolve room name for roomId=${roomId}, reportId=${reportId}. Falling back to "unknown_room"`);
    room = "unknown_room";
  }
  return {
    propertyName: prop,
    roomName: room
  };
}

/**
 * Generate folder path with user/property/room/component structure
 */
export const generateFolderPath = async (
  reportId: string,
  roomId: string,
  propertyName?: string,
  roomName?: string,
  componentName?: string,
  fileExtension?: string
): Promise<string> => {
  console.log(`📂 generateFolderPath called with:`, {
    reportId,
    roomId,
    propertyName,
    roomName,
    componentName,
    fileExtension
  });

  // Get user's full name for folder structure
  const userFullName = await getUserFullName();
  console.log("👤 User full name for folder structure:", userFullName);

  // Ensure valid property and room names
  const resolved = await resolveNamesIfMissing(reportId, roomId, propertyName, roomName);

  const cleanPropertyName = cleanNameForFolder(resolved.propertyName);
  const cleanRoomName = cleanNameForFolder(resolved.roomName);
  const cleanComponentName = componentName && componentName.trim() !== ''
    ? cleanNameForFolder(componentName)
    : 'general';

  // Warn if dirty (unknown) names are used
  if (resolved.propertyName === "unknown_property" || resolved.roomName === "unknown_room") {
    console.error(`🚨 FINAL WARNING: Using fallback names! propertyName: ${resolved.propertyName}, roomName: ${resolved.roomName} for reportId=${reportId}, roomId=${roomId}. Please check data integrity!`);
  }

  // Create folder structure: user_full_name/property_name/room_name/component_name/filename
  const fileName = `${userFullName}/${cleanPropertyName}/${cleanRoomName}/${cleanComponentName}/${uuidv4()}.${fileExtension || 'jpg'}`;

  console.log("📂 Generated upload path with user-based folder structure:", fileName);

  return fileName;
};
