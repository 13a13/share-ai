
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Clean names for folder structure (remove special characters)
 */
export function cleanNameForFolder(name: string): string {
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
 * Get user account name for folder structure
 */
export async function getUserAccountName(): Promise<string> {
  try {
    // Get the current user from the auth context
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.warn('⚠️ No authenticated user found, using fallback');
      return 'unknown_user';
    }

    // Try to get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('⚠️ Could not fetch user profile, using email or fallback');
      // Fallback to email or user ID
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return cleanNameForFolder(emailName);
    }

    // Combine first and last name
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    if (!fullName) {
      console.warn('⚠️ No name found in profile, using email or fallback');
      const emailName = user.email?.split('@')[0] || user.id.substring(0, 8);
      return cleanNameForFolder(emailName);
    }

    return cleanNameForFolder(fullName);
  } catch (error) {
    console.error('❌ Error getting user account name:', error);
    return 'unknown_user';
  }
}
