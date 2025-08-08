import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for private storage access
 */
export const createSignedUrl = async (
  filePath: string,
  bucketName: string = 'inspection-images',
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  try {
    console.log(`🔗 Creating signed URL for: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('❌ Failed to create signed URL:', error);
      return null;
    }
    
    console.log('✅ Signed URL created successfully');
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Error creating signed URL:', error);
    return null;
  }
};

/**
 * Generate signed URLs for multiple file paths
 */
export const createSignedUrls = async (
  filePaths: string[],
  bucketName: string = 'inspection-images',
  expiresIn: number = 3600
): Promise<(string | null)[]> => {
  try {
    console.log(`🔗 Creating ${filePaths.length} signed URLs`);
    
    const signedUrls = await Promise.all(
      filePaths.map(path => createSignedUrl(path, bucketName, expiresIn))
    );
    
    console.log(`✅ Created ${signedUrls.filter(url => url !== null).length}/${filePaths.length} signed URLs`);
    return signedUrls;
  } catch (error) {
    console.error('❌ Error creating signed URLs:', error);
    return filePaths.map(() => null);
  }
};

/**
 * Check if a URL is a storage path (not a full URL)
 */
export const isStoragePath = (urlOrPath: string): boolean => {
  // If it doesn't start with http/https, treat it as a storage path
  return !urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://');
};

/**
 * Convert storage paths to signed URLs, leave full URLs unchanged
 */
export const resolveImageUrl = async (
  urlOrPath: string,
  bucketName: string = 'inspection-images',
  expiresIn: number = 3600
): Promise<string> => {
  if (isStoragePath(urlOrPath)) {
    const signedUrl = await createSignedUrl(urlOrPath, bucketName, expiresIn);
    return signedUrl || urlOrPath; // Fallback to original path if signing fails
  }
  return urlOrPath; // Already a full URL
};

/**
 * Resolve multiple image URLs/paths
 */
export const resolveImageUrls = async (
  urlsOrPaths: string[],
  bucketName: string = 'inspection-images',
  expiresIn: number = 3600
): Promise<string[]> => {
  return Promise.all(
    urlsOrPaths.map(url => resolveImageUrl(url, bucketName, expiresIn))
  );
};