
import { v4 as uuidv4 } from 'uuid';
import { getUserFullName } from './userUtils';
import { resolvePropertyAndRoomNames } from './resolveNames';

/**
 * Clean names for folder structure (remove special characters)
 */
export const cleanNameForFolder = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  console.log(`🧹 [FOLDER v3] Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned;
};

/**
 * Generate folder path with user/property/room/component structure
 * This version includes comprehensive validation and error handling
 */
export const generateFolderPath = async (
  reportId: string,
  roomId: string,
  propertyName?: string,
  roomName?: string,
  componentName?: string,
  fileExtension?: string
): Promise<string> => {
  console.log(`📂 [FOLDER v3] generateFolderPath called with:`, {
    reportId,
    roomId,
    propertyName,
    roomName,
    componentName,
    fileExtension
  });

  // Get user's full name for folder structure
  const userFullName = await getUserFullName();
  console.log(`👤 [FOLDER v3] User full name: "${userFullName}"`);

  // CRITICAL: Always resolve names from database to ensure accuracy
  console.log(`🔍 [FOLDER v3] Resolving names from database...`);
  const resolved = await resolvePropertyAndRoomNames(roomId, propertyName, roomName);
  
  console.log(`📂 [FOLDER v3] Resolution result:`, resolved);

  // Validate that we got valid names (not error states)
  if (resolved.propertyName.startsWith('error_') || resolved.roomName.startsWith('error_')) {
    console.error(`❌ [FOLDER v3] Resolution failed with error names:`, resolved);
    // Still proceed but with error indicators in path for debugging
  }

  // Check if we're still getting generic fallbacks
  if (resolved.propertyName === 'unknown_property' || resolved.roomName === 'unknown_room') {
    console.error(`🚨 [FOLDER v3] STILL GETTING GENERIC NAMES!`, {
      roomId,
      provided: { propertyName, roomName },
      resolved
    });
  }

  const cleanPropertyName = cleanNameForFolder(resolved.propertyName);
  const cleanRoomName = cleanNameForFolder(resolved.roomName);
  const cleanComponentName = componentName && componentName.trim() !== ''
    ? cleanNameForFolder(componentName)
    : 'general';

  // Create folder structure: user_full_name/property_name/room_name/component_name/filename
  const fileName = `${userFullName}/${cleanPropertyName}/${cleanRoomName}/${cleanComponentName}/${uuidv4()}.${fileExtension || 'jpg'}`;

  console.log(`📂 [FOLDER v3] Generated upload path:`, fileName);
  
  // Final validation log
  console.log(`📊 [FOLDER v3] Path analysis:`, {
    userPart: userFullName,
    propertyPart: cleanPropertyName,
    roomPart: cleanRoomName,
    componentPart: cleanComponentName,
    isGeneric: cleanPropertyName.includes('unknown') || cleanRoomName.includes('unknown'),
    hasErrors: cleanPropertyName.includes('error') || cleanRoomName.includes('error')
  });

  return fileName;
};
