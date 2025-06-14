
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
    
    // Now get the room and property information with a more comprehensive query
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

    const propertyName = roomData.properties.name || 'Unknown Property';
    const roomType = roomData.type || 'unknown_room';
    
    // Generate a clean room name based on room type
    const roomName = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      propertyName: cleanNameForFolder(propertyName),
      roomName: cleanNameForFolder(roomName),
      roomType: roomType,
      propertyId: roomData.property_id,
      roomId: actualRoomId
    };

    console.log('🏠 Final property and room info:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    
    // Return meaningful fallback values that indicate the error
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
 * Build correct storage path with proper folder structure
 */
export async function buildCorrectStoragePath(
  originalUrl: string, 
  reportId: string, 
  roomId?: string,
  componentName?: string
): Promise<{ newPath: string; shouldMove: boolean; propertyRoomInfo: PropertyRoomInfo }> {
  try {
    console.log(`📂 Building correct path for: ${originalUrl}`);
    
    // Get correct property and room info - this is critical
    const propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
    
    // Extract the file name from the original URL
    const urlParts = originalUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Find the user folder - it should be after the bucket name in the path
    let userFolder = 'unknown_user';
    const pathAfterPublic = originalUrl.split('/storage/v1/object/public/')[1];
    if (pathAfterPublic) {
      const pathSegments = pathAfterPublic.split('/');
      if (pathSegments.length > 1) {
        // Skip the bucket name, get the user folder
        userFolder = pathSegments[1];
      }
    }
    
    // Clean component name or use 'general' as default
    const cleanComponentName = componentName ? cleanNameForFolder(componentName) : 'general';
    
    // Build the correct path: user/property_name/room_name/component_name/filename
    const correctPath = `${userFolder}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/${cleanComponentName}/${fileName}`;
    
    // Check if the current path is different from the correct path
    const currentPath = pathAfterPublic;
    const shouldMove = currentPath !== correctPath;
    
    console.log(`📂 Path analysis:`, {
      currentPath,
      correctPath,
      shouldMove,
      propertyName: propertyRoomInfo.propertyName,
      roomName: propertyRoomInfo.roomName,
      componentName: cleanComponentName
    });
    
    return {
      newPath: correctPath,
      shouldMove,
      propertyRoomInfo
    };
  } catch (error) {
    console.error('❌ Error building correct storage path:', error);
    throw error; // Re-throw to handle upstream
  }
}

/**
 * Move file in storage to correct folder structure and ensure directories exist
 */
export async function moveFileToCorrectFolder(
  originalUrl: string,
  correctPath: string
): Promise<string> {
  try {
    console.log(`📦 Moving file from ${originalUrl} to ${correctPath}`);
    
    // Extract the bucket name
    const possibleBuckets = ['inspection-images', 'report-images'];
    let bucketName = 'inspection-images'; // Default
    
    // Determine which bucket is being used
    for (const bucket of possibleBuckets) {
      if (originalUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
        bucketName = bucket;
        break;
      }
    }
    
    // Extract original path from URL
    const bucketPattern = `/storage/v1/object/public/${bucketName}/`;
    const pathAfterPublic = originalUrl.split(bucketPattern)[1];
    
    if (!pathAfterPublic) {
      console.error('❌ Could not extract path from URL');
      return originalUrl;
    }
    
    console.log(`📦 Storage operation:`, {
      bucketName,
      originalPath: pathAfterPublic,
      correctPath,
      originalUrl
    });
    
    // Create directory structure by uploading a temporary file in each directory level
    const pathParts = correctPath.split('/');
    let currentPath = '';
    
    // Create each directory level (excluding the filename)
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath += (i > 0 ? '/' : '') + pathParts[i];
      const tempFilePath = `${currentPath}/.temp_${Date.now()}`;
      
      try {
        // Create a tiny temporary file to ensure the directory exists
        const { error: tempError } = await supabase.storage
          .from(bucketName)
          .upload(tempFilePath, new Blob(['temp']), { upsert: true });
        
        if (!tempError) {
          // Immediately delete the temp file
          await supabase.storage.from(bucketName).remove([tempFilePath]);
          console.log(`✅ Created directory: ${currentPath}`);
        }
      } catch (dirError) {
        console.warn(`⚠️ Could not create directory ${currentPath}:`, dirError);
      }
    }
    
    // Now copy the file to the correct location
    console.log(`📋 Copying from "${pathAfterPublic}" to "${correctPath}"`);
    const { data: copyData, error: copyError } = await supabase.storage
      .from(bucketName)
      .copy(pathAfterPublic, correctPath);
    
    if (copyError) {
      console.error('❌ Error copying file:', copyError);
      return originalUrl;
    }
    
    console.log('✅ File copied successfully:', copyData);
    
    // Delete the original file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([pathAfterPublic]);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete original file:', deleteError);
    } else {
      console.log('✅ Original file deleted successfully');
    }
    
    // Construct and return the new URL
    const baseUrl = originalUrl.split(bucketPattern)[0];
    const newUrl = `${baseUrl}${bucketPattern}${correctPath}`;
    
    console.log(`✅ File moved successfully. New URL: ${newUrl}`);
    
    return newUrl;
  } catch (error) {
    console.error('❌ Error moving file:', error);
    return originalUrl;
  }
}

/**
 * Check if URL needs folder correction (always true now since we want to ensure correct structure)
 */
export function needsFolderCorrection(imageUrl: string): boolean {
  return imageUrl.includes('supabase.co/storage') || imageUrl.includes('/storage/v1/object/public/');
}
