
import { v4 as uuidv4 } from 'uuid';
import { getUserFullName } from './userUtils';

/**
 * Clean names for folder structure (remove special characters)
 */
export const cleanNameForFolder = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  console.log(`🧹 Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned;
};

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
  
  // Clean names for folder structure with better fallbacks
  const cleanPropertyName = propertyName && propertyName.trim() !== '' 
    ? cleanNameForFolder(propertyName)
    : `property_${reportId.substring(0, 8)}`;
  
  const cleanRoomName = roomName && roomName.trim() !== ''
    ? cleanNameForFolder(roomName)
    : `room_${roomId.substring(0, 8)}`;
  
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
