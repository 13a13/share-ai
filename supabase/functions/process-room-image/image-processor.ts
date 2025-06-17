
import { 
  getPropertyAndRoomInfo, 
  organizeImageIntoFolders,
  PropertyRoomInfo
} from "./database-utils.ts";

export interface ProcessedImageResult {
  processedImages: string[];
  organizedImageUrls: string[];
  propertyRoomInfo: PropertyRoomInfo | null;
}

/**
 * Process and organize images for AI analysis
 */
export async function processAndOrganizeImages(
  images: string[],
  componentName: string | undefined,
  reportId: string | undefined,
  roomId: string | undefined
): Promise<ProcessedImageResult> {
  console.log(`📸 Processing ${componentName || 'component'} with ${images.length} images`);

  // Get correct property and room information from database if reportId is provided
  let propertyRoomInfo: PropertyRoomInfo | null = null;
  if (reportId) {
    try {
      propertyRoomInfo = await getPropertyAndRoomInfo(reportId, roomId);
      console.log(`🏠 Successfully retrieved property and room info:`, propertyRoomInfo);
    } catch (error) {
      console.error('❌ Failed to fetch property/room info from database:', error);
      throw new Error(`Failed to fetch property and room information: ${error.message}`);
    }
  }

  // Process each image URL to organize into proper folder structure and convert to base64
  const processedImages: string[] = [];
  const organizedImageUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    try {
      let finalImageUrl = imageUrl;
      
      // Organize image into proper folder structure if we have property/room info
      if (propertyRoomInfo && imageUrl.includes('supabase.co/storage') && componentName) {
        console.log(`📂 [Image ${i + 1}/${images.length}] Organizing into folder hierarchy: ${propertyRoomInfo.userAccountName}/${propertyRoomInfo.propertyName}/${propertyRoomInfo.roomName}/${componentName}`);
        
        try {
          const organizedUrl = await organizeImageIntoFolders(
            imageUrl,
            propertyRoomInfo,
            componentName
          );
          
          if (organizedUrl !== imageUrl) {
            finalImageUrl = organizedUrl;
            console.log(`✅ [Image ${i + 1}/${images.length}] Successfully organized into hierarchy: ${propertyRoomInfo.userAccountName} → ${propertyRoomInfo.propertyName} → ${propertyRoomInfo.roomName} → ${componentName}`);
          } else {
            console.log(`⚠️ [Image ${i + 1}/${images.length}] Organization failed, using original URL`);
          }
        } catch (organizeError) {
          console.error(`❌ [Image ${i + 1}/${images.length}] Error organizing into hierarchy:`, organizeError);
          // Continue with original URL if organization fails
        }
      }
      
      organizedImageUrls.push(finalImageUrl);
      
      // Convert to base64 for AI processing
      const base64Image = await convertImageToBase64(finalImageUrl, i + 1, images.length);
      if (base64Image) {
        processedImages.push(base64Image);
      }
    } catch (error) {
      console.error(`❌ [Image ${i + 1}/${images.length}] Error processing image ${imageUrl}:`, error);
      // Skip this image and continue with others
    }
  }

  if (processedImages.length === 0) {
    console.error('❌ No valid images to process');
    throw new Error("No valid images to process");
  }

  console.log(`📸 Successfully prepared ${processedImages.length} images for AI processing`);

  return {
    processedImages,
    organizedImageUrls,
    propertyRoomInfo
  };
}

/**
 * Convert image URL to base64 for AI processing with proper large image handling
 */
async function convertImageToBase64(
  imageUrl: string, 
  imageIndex: number, 
  totalImages: number
): Promise<string | null> {
  if (imageUrl.startsWith("data:")) {
    // Already base64 data URL
    return imageUrl.split(",")[1];
  } else if (imageUrl.includes('supabase.co/storage')) {
    // Fetch the image from Supabase storage and convert to base64
    console.log(`📥 [Image ${imageIndex}/${totalImages}] Fetching image from organized storage: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`❌ [Image ${imageIndex}/${totalImages}] Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      return null;
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    console.log(`✅ [Image ${imageIndex}/${totalImages}] Successfully converted organized image to base64`);
    return base64;
  } else {
    // Assume it's already base64
    return imageUrl;
  }
}

/**
 * Safely convert ArrayBuffer to base64 using chunk-based processing
 * This prevents stack overflow errors with large images
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768; // 32KB chunks to prevent stack overflow
  let result = '';
  
  // Process in chunks to avoid stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const chunkArray = Array.from(chunk);
    result += String.fromCharCode(...chunkArray);
  }
  
  return btoa(result);
}
