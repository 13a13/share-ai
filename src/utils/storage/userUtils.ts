
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current user's full name for folder structure
 */
export const getUserFullName = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("⚠️ No authenticated user found, using 'unknown_user'");
      return 'unknown_user';
    }

    // Try to get user profile information
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.warn("⚠️ Could not fetch user profile, using email or fallback");
      // Fallback to email or user ID
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return emailName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
    }

    // Combine first and last name
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    if (!fullName) {
      console.warn("⚠️ No name found in profile, using email or fallback");
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return emailName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
    }

    // Clean the full name for folder structure
    return fullName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').toLowerCase();
  } catch (error) {
    console.error("❌ Error getting user full name:", error);
    return 'unknown_user';
  }
};
