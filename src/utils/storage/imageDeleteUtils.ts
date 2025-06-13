
import { extractFilePathFromUrl, deleteFileFromStorage } from './storageUtils';

/**
 * Delete an image from Supabase Storage
 */
export const deleteReportImage = async (imageUrl: string): Promise<void> => {
  try {
    console.log("🗑️ Attempting to delete image:", imageUrl);
    
    // Extract file path from URL
    const fileName = extractFilePathFromUrl(imageUrl);
    
    if (!fileName) {
      return; // Error already logged in extractFilePathFromUrl
    }
    
    // Delete from storage
    await deleteFileFromStorage(fileName);
  } catch (error) {
    console.error("❌ Error in deleteReportImage:", error);
  }
};
