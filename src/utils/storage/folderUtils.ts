
import { v4 as uuidv4 } from 'uuid';
import { getUserFullName } from './userUtils';

/**
 * Clean names for folder structure (remove special characters)
 */
export const cleanNameForFolder = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
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
  // Get user's full name for folder structure
  const userFullName = await getUserFullName();
  console.log("👤 User full name for folder structure:", userFullName);
  
  // Clean names for folder structure
  const cleanPropertyName = propertyName 
    ? cleanNameForFolder(propertyName)
    : 'unknown_property';
  
  const cleanRoomName = roomName
    ? cleanNameForFolder(roomName)
    : `room_${roomId.substring(0, 8)}`;
  
  const cleanComponentName = componentName
    ? cleanNameForFolder(componentName)
    : 'general';
  
  // Create folder structure: user_full_name/property_name/room_name/component_name/filename
  const fileName = `${userFullName}/${cleanPropertyName}/${cleanRoomName}/${cleanComponentName}/${uuidv4()}.${fileExtension || 'jpg'}`;
  
  console.log("📂 Generated upload path with user-based folder structure:", fileName);
  
  return fileName;
};
