import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Session invalidation request received');

    // Create anon client to validate user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔍 Invalidating all sessions for user: ${user.id}`);

    // Create service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use admin API to sign out user from all sessions
    const { error: signOutError } = await serviceClient.auth.admin.signOut(user.id, 'global');
    
    if (signOutError) {
      console.error('❌ Failed to sign out user globally:', signOutError);
      return new Response(
        JSON.stringify({ error: 'Failed to invalidate sessions' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Also update our tracking table
    const { error: dbError } = await serviceClient
      .from('user_sessions')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (dbError) {
      console.warn('⚠️ Failed to update session tracking table:', dbError);
      // Don't fail the request since the main signOut succeeded
    }

    console.log('✅ Successfully invalidated all sessions');

    return new Response(
      JSON.stringify({ success: true, message: 'All sessions invalidated' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});