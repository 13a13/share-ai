
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for managing Supabase storage
 */

/**
 * Ensures the inspection-images bucket exists, creates it if not
 */
export const ensureInspectionImagesBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'inspection-images');
    
    if (bucketExists) {
      console.log('inspection-images bucket already exists');
      return true;
    }
    
    // Create the bucket if it doesn't exist
    console.log('Creating inspection-images bucket...');
    const { error: createError } = await supabase.storage.createBucket('inspection-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    
    console.log('inspection-images bucket created successfully');
    return true;
  } catch (error) {
    console.error('Error in ensureInspectionImagesBucket:', error);
    return false;
  }
};

/**
 * Lists all files in the inspection-images bucket
 */
export const listInspectionImages = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('inspection-images')
      .list('', { 
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('Error listing files:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in listInspectionImages:', error);
    return [];
  }
};

/**
 * Gets the public URL for a stored image
 */
export const getImagePublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('inspection-images')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Deletes an image from storage
 */
export const deleteStorageImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('inspection-images')
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteStorageImage:', error);
    return false;
  }
};

/**
 * Gets detailed information about storage usage
 */
export const getStorageInfo = async () => {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    const files = await listInspectionImages();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    const inspectionBucket = buckets?.find(b => b.name === 'inspection-images');
    
    // Get database records
    const { data: dbImages, error: dbError } = await supabase
      .from('inspection_images')
      .select('*');
    
    if (dbError) {
      throw dbError;
    }
    
    return {
      bucket: inspectionBucket,
      filesInStorage: files.length,
      recordsInDatabase: dbImages?.length || 0,
      files: files.slice(0, 10), // First 10 files
      dbRecords: dbImages?.slice(0, 10) // First 10 records
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    throw error;
  }
};
