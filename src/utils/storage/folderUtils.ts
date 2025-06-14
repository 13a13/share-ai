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
        .select('id, name, property_id, properties(name)')
        .eq('id', roomId)
        .maybeSingle();
      if (data && !error) {
        if (!room) room = (data as any).name ?? "room";
        if (!prop && (data as any).properties) prop = (data as any).properties.name ?? "property";
      }
    } catch (err) {}
  }
  return {
    propertyName: prop ?? "unknown_property",
    roomName: room ?? "unknown_room"
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

  console.log(`📂 Final folder names:`, {
    userFullName,
    cleanPropertyName,
    cleanRoomName,
    cleanComponentName
  });

  // Create folder structure: user_full_name/property_name/room_name/component_name/filename
  const fileName = `${userFullName}/${cleanPropertyName}/${cleanRoomName}/${cleanComponentName}/${uuidv4()}.${fileExtension || 'jpg'}`;

  console.log("📂 Generated upload path with user-based folder structure:", fileName);

  return fileName;
};
