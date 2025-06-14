
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
 * Extract file path from URL and check if it needs correction
 */
export function needsFolderCorrection(imageUrl: string): boolean {
  try {
    console.log(`🔍 Checking if URL needs folder correction: ${imageUrl}`);
    
    // Check if this is a Supabase storage URL
    if (!imageUrl.includes('supabase.co/storage') && !imageUrl.includes('/storage/v1/object/public/')) {
      console.log('❌ Not a Supabase storage URL');
      return false;
    }
    
    // Check if URL contains problematic folder names - broader detection
    const problematicPatterns = [
      'unknown_property',
      'unknown_room',
      'unknown_user',
      '/property_[a-f0-9]{8}/', // Matches property_5690e738 pattern
      '/room_[a-f0-9]{8}/',     // Matches room_9836d4c8 pattern
      '/user_[a-f0-9]{8}/'      // Matches user_1234abcd pattern
    ];
    
    const needsCorrection = problematicPatterns.some(pattern => {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Use regex for UUID patterns
        const regex = new RegExp(pattern);
        const matches = regex.test(imageUrl);
        if (matches) console.log(`✅ Found problematic pattern: ${pattern}`);
        return matches;
      } else {
        // Simple string match for unknown_ patterns
        const matches = imageUrl.includes(pattern);
        if (matches) console.log(`✅ Found problematic name: ${pattern}`);
        return matches;
      }
    });
    
    console.log(`🔍 Needs correction: ${needsCorrection}`);
    return needsCorrection;
  } catch (error) {
    console.error('❌ Error checking folder correction need:', error);
    return false;
  }
}

/**
 * Build correct storage path with proper folder structure
 */
export async function buildCorrectStoragePath(
  originalUrl: string, 
  reportId: string, 
  roomId?: string
): Promise<{ newPath: string; shouldMove: boolean }> {
  try {
    console.log(`📂 Building correct path for: ${originalUrl}`);
    
    // Get correct property and room info
    const propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
    
    // Extract the file name and user folder from the original URL
    const urlParts = originalUrl.split('/');
    const fileName = urlParts[urlParts.length - 1]; // Get the actual filename
    
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
    
    // Build the correct path
    const correctPath = `${userFolder}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/general/${fileName}`;
    
    // Check if the current path is different from the correct path
    const currentPath = pathAfterPublic;
    const shouldMove = currentPath !== correctPath && needsFolderCorrection(originalUrl);
    
    console.log(`📂 Path analysis:`, {
      currentPath,
      correctPath,
      shouldMove,
      propertyName: propertyRoomInfo.propertyName,
      roomName: propertyRoomInfo.roomName
    });
    
    return {
      newPath: correctPath,
      shouldMove
    };
  } catch (error) {
    console.error('❌ Error building correct storage path:', error);
    return {
      newPath: originalUrl,
      shouldMove: false
    };
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
    
    // Extract the bucket name - try multiple possible bucket names
    const possibleBuckets = ['report-images', 'inspection-images'];
    let bucketName = 'report-images'; // Default
    
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
    
    // First, check if the target path already exists
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { search: correctPath });
    
    if (listError) {
      console.error('❌ Error checking existing files:', listError);
    } else if (existingFiles && existingFiles.length > 0) {
      console.log('✅ Target file already exists, skipping move');
      const baseUrl = originalUrl.split(bucketPattern)[0];
      return `${baseUrl}${bucketPattern}${correctPath}`;
    }
    
    // Copy the file to the new location
    console.log(`📋 Copying from "${pathAfterPublic}" to "${correctPath}"`);
    const { data: copyData, error: copyError } = await supabase.storage
      .from(bucketName)
      .copy(pathAfterPublic, correctPath);
    
    if (copyError) {
      console.error('❌ Error copying file:', copyError);
      
      // If copy fails, try to create the directory structure first
      if (copyError.message?.includes('NotFound') || copyError.message?.includes('no such file')) {
        console.log('🔄 Trying to create directory structure first...');
        
        // Create an empty file in the target directory to ensure it exists
        const dirPath = correctPath.substring(0, correctPath.lastIndexOf('/'));
        const tempFileName = `${dirPath}/.temp`;
        
        const { error: tempError } = await supabase.storage
          .from(bucketName)
          .upload(tempFileName, new Blob(['temp']), { upsert: true });
        
        if (!tempError) {
          // Try the copy operation again
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucketName)
            .copy(pathAfterPublic, correctPath);
          
          if (retryError) {
            console.error('❌ Retry copy also failed:', retryError);
            return originalUrl;
          }
          
          // Clean up temp file
          await supabase.storage.from(bucketName).remove([tempFileName]);
          console.log('✅ File copied successfully after directory creation');
        } else {
          console.error('❌ Could not create directory structure:', tempError);
          return originalUrl;
        }
      } else {
        return originalUrl;
      }
    } else {
      console.log('✅ File copied successfully:', copyData);
    }
    
    // Delete the original file only if copy was successful
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([pathAfterPublic]);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete original file (keeping both):', deleteError);
      // Don't fail the operation if we can't delete the original
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
