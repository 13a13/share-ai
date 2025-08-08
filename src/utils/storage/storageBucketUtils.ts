
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if storage bucket exists and is accessible
 */
export const checkStorageBucket = async (bucketName: string = 'inspection-images'): Promise<boolean> => {
  try {
    console.log("🔍 Checking storage bucket availability...");
    
    // Since we just created the bucket with the migration, we know it exists
    // But let's still test access to be sure
    try {
      console.log("🔐 Testing bucket access permissions...");
      
      // Try to list objects to test access
      const { data: listData, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      // Note: For private buckets without SELECT policy, this may fail as expected
      // We'll treat access denied as a signal to rely on signed URLs
      
      
      if (listError) {
        console.error("❌ Storage bucket exists but access denied:", listError);
        return false;
      }
      
      console.log("✅ Storage bucket accessible and ready for uploads");
      return true;
    } catch (accessError) {
      console.error("❌ Error testing storage access:", accessError);
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking storage bucket:", error);
    return false;
  }
};
