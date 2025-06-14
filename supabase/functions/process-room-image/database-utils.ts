
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface PropertyRoomInfo {
  propertyName: string;
  roomName: string;
  roomType: string;
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
    
    // Now get the room and property information
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        type,
        property_id,
        properties (
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

    if (!roomData) {
      console.error('❌ No room found for roomId:', actualRoomId);
      throw new Error(`No room found for roomId: ${actualRoomId}`);
    }

    console.log('✅ Room data retrieved:', roomData);

    const propertyName = roomData.properties?.name || 'unknown_property';
    const roomType = roomData.type || 'unknown_room';
    
    // Generate a clean room name based on room type
    const roomName = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      propertyName: cleanNameForFolder(propertyName),
      roomName: cleanNameForFolder(roomName),
      roomType: roomType
    };

    console.log('🏠 Final property and room info:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in getPropertyAndRoomInfo:', error);
    
    // Enhanced fallback: try to get minimal info if main query fails
    try {
      console.log('🔄 Attempting fallback query...');
      
      const { data: fallbackInspection } = await supabase
        .from('inspections')
        .select('room_id')
        .eq('id', reportId)
        .single();
      
      if (fallbackInspection?.room_id) {
        const { data: fallbackRoom } = await supabase
          .from('rooms')
          .select('type, properties(name)')
          .eq('id', fallbackInspection.room_id)
          .single();
        
        if (fallbackRoom) {
          console.log('✅ Fallback data retrieved:', fallbackRoom);
          return {
            propertyName: cleanNameForFolder(fallbackRoom.properties?.name || 'property'),
            roomName: cleanNameForFolder(fallbackRoom.type || 'room'),
            roomType: fallbackRoom.type || 'room'
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback query also failed:', fallbackError);
    }
    
    // Final fallback values
    return {
      propertyName: 'unknown_property',
      roomName: 'unknown_room',
      roomType: 'unknown_room'
    };
  }
}

/**
 * Clean names for folder structure (remove special characters)
 */
function cleanNameForFolder(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  console.log(`🧹 Cleaned folder name: "${name}" -> "${cleaned}"`);
  return cleaned;
}

/**
 * Extract folder structure from storage URL and replace with correct names
 */
export async function getCorrectStoragePath(
  originalUrl: string, 
  reportId: string, 
  roomId?: string
): Promise<string> {
  try {
    console.log(`📂 Processing storage URL: ${originalUrl}`);
    
    // Get correct property and room info
    const propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
    
    // Extract the file path from the URL
    const urlParts = originalUrl.split('/');
    const fileName = urlParts[urlParts.length - 1]; // Get the actual filename
    
    // Find the user folder (should be the first folder after the bucket)
    let userFolder = 'unknown_user';
    const storagePathStart = originalUrl.indexOf('/storage/v1/object/public/');
    if (storagePathStart !== -1) {
      const pathAfterBucket = originalUrl.substring(storagePathStart).split('/').slice(6); // Skip '/storage/v1/object/public/bucket-name/'
      if (pathAfterBucket.length > 0) {
        userFolder = pathAfterBucket[0];
      }
    }
    
    // Construct the correct path
    const correctPath = `${userFolder}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/general/${fileName}`;
    console.log(`📂 Correct storage path: ${correctPath}`);
    
    return correctPath;
  } catch (error) {
    console.error('❌ Error getting correct storage path:', error);
    return originalUrl;
  }
}

/**
 * Move file in storage to correct folder structure
 */
export async function moveFileToCorrectFolder(
  originalUrl: string,
  correctPath: string
): Promise<string> {
  try {
    console.log(`📦 Moving file from ${originalUrl} to ${correctPath}`);
    
    // Extract the original file path from the URL
    const bucketName = 'report-images'; // Assuming this is the bucket name
    const originalPath = originalUrl.split('/object/public/report-images/')[1];
    
    if (!originalPath) {
      console.error('❌ Could not extract original path from URL');
      return originalUrl;
    }
    
    // First, copy the file to the new location
    const { data: copyData, error: copyError } = await supabase.storage
      .from(bucketName)
      .copy(originalPath, correctPath);
    
    if (copyError) {
      console.error('❌ Error copying file:', copyError);
      return originalUrl;
    }
    
    console.log('✅ File copied successfully:', copyData);
    
    // Delete the original file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([originalPath]);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete original file:', deleteError);
      // Don't fail the operation if we can't delete the original
    }
    
    // Return the new URL
    const newUrl = originalUrl.replace(originalPath, correctPath);
    console.log(`✅ File moved successfully. New URL: ${newUrl}`);
    
    return newUrl;
  } catch (error) {
    console.error('❌ Error moving file:', error);
    return originalUrl;
  }
}
