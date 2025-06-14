
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { cleanNameForFolder } from './user-utils.ts';
import { PropertyRoomInfo } from './property-room-queries.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
 * Check if URL needs folder correction (always true for proper organization)
 */
export function needsFolderCorrection(imageUrl: string): boolean {
  return imageUrl.includes('supabase.co/storage') || imageUrl.includes('/storage/v1/object/public/');
}
