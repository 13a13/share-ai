
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface PropertyRoomInfo {
  propertyName: string;
  roomName: string;
  roomType: string;
  propertyId: string;
  roomId: string;
  userAccountName: string;
}

/**
 * Get user account name for folder structure
 */
async function getUserAccountName(): Promise<string> {
  try {
    // Get the current user from the auth context
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.warn('⚠️ No authenticated user found, using fallback');
      return 'unknown_user';
    }

    // Try to get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('⚠️ Could not fetch user profile, using email or fallback');
      // Fallback to email or user ID
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return cleanNameForFolder(emailName);
    }

    // Combine first and last name
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    if (!fullName) {
      console.warn('⚠️ No name found in profile, using email or fallback');
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return cleanNameForFolder(emailName);
    }

    return cleanNameForFolder(fullName);
  } catch (error) {
    console.error('❌ Error getting user account name:', error);
    return 'unknown_user';
  }
}

/**
 * Fetch property and room information from the database
 */
export async function getPropertyAndRoomInfo(reportId: string, roomId?: string): Promise<PropertyRoomInfo> {
  try {
    console.log(`🔍 Fetching property and room info for reportId: ${reportId}, roomId: ${roomId}`);
    
    // First, get the inspection to find the room_id
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, room_id')
      .eq('id', reportId)
      .single();

    if (inspectionError) {
      console.error('❌ Error fetching inspection:', inspectionError);
      throw new Error(`Failed to fetch inspection: ${inspectionError.message}`);
    }

    if (!inspection) {
      console.error('❌ No inspection found for reportId:', reportId);
      throw new Error(`No inspection found for reportId: ${reportId}`);
    }

    console.log('✅ Inspection data retrieved:', inspection);

    // Use the roomId from the inspection
    const actualRoomId = inspection.room_id;
    
    // Now get the room and property information with a comprehensive query
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        type,
        property_id,
        properties!inner (
          id,
          name
        )
      `)
      .eq('id', actualRoomId)
      .single();

    if (roomError) {
      console.error('❌ Error fetching room:', roomError);
      throw new Error(`Failed to fetch room: ${roomError.message}`);
    }

    if (!roomData || !roomData.properties) {
      console.error('❌ No room or property found for roomId:', actualRoomId);
      throw new Error(`No room or property found for roomId: ${actualRoomId}`);
    }

    console.log('✅ Room and property data retrieved:', roomData);

    // Get user account name for folder structure
    const userAccountName = await getUserAccountName();

    const propertyName = roomData.properties.name || 'Unknown Property';
    const roomType = roomData.type || 'unknown_room';
    
    // Generate a clean room name based on room type
    const roomName = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      propertyName: cleanNameForFolder(propertyName),
      roomName: cleanNameForFolder(roomName),
      roomType: roomType,
      propertyId: roomData.property_id,
      roomId: actualRoomId,
      userAccountName: userAccountName
    };

    console.log('🏠 Final property and room info:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    throw new Error(`Could not fetch property/room info: ${error.message}`);
  }
}

/**
 * Clean names for folder structure (remove special characters)
 */
function cleanNameForFolder(name: string): string {
  if (!name || name.trim() === '') {
    return 'unknown';
  }
  
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  console.log(`🧹 Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned || 'unknown';
}

/**
 * Create proper folder hierarchy: account/property/room/component
 */
export async function createFolderHierarchy(
  propertyRoomInfo: PropertyRoomInfo,
  componentName: string,
  bucketName: string = 'inspection-images'
): Promise<string> {
  try {
    const cleanComponentName = cleanNameForFolder(componentName);
    
    // Build the complete folder path: account/property/room/component
    const folderPath = `${propertyRoomInfo.userAccountName}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/${cleanComponentName}`;
    
    console.log(`📂 Creating folder hierarchy: ${folderPath}`);
    
    // Create each directory level by uploading temporary files
    const pathParts = folderPath.split('/');
    let currentPath = '';
    
    for (let i = 0; i < pathParts.length; i++) {
      currentPath += (i > 0 ? '/' : '') + pathParts[i];
      const tempFilePath = `${currentPath}/.temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Create a tiny temporary file to ensure the directory exists
        const { error: tempError } = await supabase.storage
          .from(bucketName)
          .upload(tempFilePath, new Blob(['temp']), { upsert: true });
        
        if (!tempError) {
          // Immediately delete the temp file
          await supabase.storage.from(bucketName).remove([tempFilePath]);
          console.log(`✅ Created directory level: ${currentPath}`);
        } else {
          console.warn(`⚠️ Could not create directory ${currentPath}:`, tempError);
        }
      } catch (dirError) {
        console.warn(`⚠️ Could not create directory ${currentPath}:`, dirError);
      }
    }
    
    return folderPath;
  } catch (error) {
    console.error('❌ Error creating folder hierarchy:', error);
    throw error;
  }
}

/**
 * Move and organize image into proper folder structure
 */
export async function organizeImageIntoFolders(
  originalUrl: string,
  propertyRoomInfo: PropertyRoomInfo,
  componentName: string,
  bucketName: string = 'inspection-images'
): Promise<string> {
  try {
    console.log(`📦 Organizing image into proper folder structure: ${originalUrl}`);
    
    // Create the proper folder hierarchy
    const folderPath = await createFolderHierarchy(propertyRoomInfo, componentName, bucketName);
    
    // Extract the original file name from the URL
    const urlParts = originalUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1];
    
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExtension = originalFileName.split('.').pop() || 'jpg';
    const newFileName = `${timestamp}_${randomId}.${fileExtension}`;
    
    // Build the complete new path
    const newPath = `${folderPath}/${newFileName}`;
    
    // Extract original path from URL
    const bucketPattern = `/storage/v1/object/public/${bucketName}/`;
    const originalPath = originalUrl.split(bucketPattern)[1];
    
    if (!originalPath) {
      console.error('❌ Could not extract original path from URL');
      return originalUrl;
    }
    
    console.log(`📦 Moving from "${originalPath}" to "${newPath}"`);
    
    // Copy the file to the new organized location
    const { data: copyData, error: copyError } = await supabase.storage
      .from(bucketName)
      .copy(originalPath, newPath);
    
    if (copyError) {
      console.error('❌ Error copying file to organized location:', copyError);
      return originalUrl;
    }
    
    console.log('✅ File copied to organized location:', copyData);
    
    // Delete the original file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([originalPath]);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete original file:', deleteError);
    } else {
      console.log('✅ Original file deleted successfully');
    }
    
    // Construct and return the new URL
    const baseUrl = originalUrl.split(bucketPattern)[0];
    const newUrl = `${baseUrl}${bucketPattern}${newPath}`;
    
    console.log(`✅ Image organized successfully. New URL: ${newUrl}`);
    console.log(`📂 Folder structure: ${propertyRoomInfo.userAccountName} → ${propertyRoomInfo.propertyName} → ${propertyRoomInfo.roomName} → ${cleanNameForFolder(componentName)}`);
    
    return newUrl;
  } catch (error) {
    console.error('❌ Error organizing image into folders:', error);
    return originalUrl;
  }
}

/**
 * Build correct storage path with proper folder structure - DEPRECATED
 * Keeping for backward compatibility but now using organizeImageIntoFolders
 */
export async function buildCorrectStoragePath(
  originalUrl: string, 
  reportId: string, 
  roomId?: string,
  componentName?: string
): Promise<{ newPath: string; shouldMove: boolean; propertyRoomInfo: PropertyRoomInfo }> {
  try {
    console.log(`📂 Building correct path for: ${originalUrl}`);
    
    // Get correct property and room info
    const propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
    
    // Always organize into proper structure
    const shouldMove = true; // Always organize
    
    // Clean component name or use 'general' as default
    const cleanComponentName = componentName ? cleanNameForFolder(componentName) : 'general';
    
    // Build the correct path: account/property/room/component/filename
    const urlParts = originalUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const correctPath = `${propertyRoomInfo.userAccountName}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/${cleanComponentName}/${fileName}`;
    
    console.log(`📂 Path analysis:`, {
      correctPath,
      shouldMove,
      propertyName: propertyRoomInfo.propertyName,
      roomName: propertyRoomInfo.roomName,
      componentName: cleanComponentName,
      userAccountName: propertyRoomInfo.userAccountName
    });
    
    return {
      newPath: correctPath,
      shouldMove,
      propertyRoomInfo
    };
  } catch (error) {
    console.error('❌ Error building correct storage path:', error);
    throw error;
  }
}

/**
 * Move file in storage to correct folder structure - DEPRECATED
 * Now using organizeImageIntoFolders for better organization
 */
export async function moveFileToCorrectFolder(
  originalUrl: string,
  correctPath: string
): Promise<string> {
  console.log('⚠️ moveFileToCorrectFolder is deprecated, using organizeImageIntoFolders instead');
  return originalUrl;
}

/**
 * Check if URL needs folder correction (always true for proper organization)
 */
export function needsFolderCorrection(imageUrl: string): boolean {
  return imageUrl.includes('supabase.co/storage') || imageUrl.includes('/storage/v1/object/public/');
}
