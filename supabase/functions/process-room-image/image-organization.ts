
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { cleanNameForFolder } from './user-utils.ts';
import { PropertyRoomInfo } from './property-room-queries.ts';
import { createFolderHierarchy } from './folder-operations.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
  // This function is deprecated but kept for backward compatibility
  // It now imports and uses the new modular functions
  const { getPropertyAndRoomInfo } = await import('./property-room-queries.ts');
  
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
