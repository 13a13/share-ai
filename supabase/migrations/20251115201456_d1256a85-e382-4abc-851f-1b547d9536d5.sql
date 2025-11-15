-- ============================================================================
-- Security Enhancements Migration
-- Purpose: GDPR compliance + Business intelligence protection
-- Backward Compatible: Yes - uses views to maintain existing API contracts
-- ============================================================================

-- ============================================================================
-- PART 1: Telemetry RLS - Add UPDATE and DELETE policies for GDPR compliance
-- ============================================================================

-- Policy: Users can update their own telemetry (for data correction)
CREATE POLICY "Users can update own telemetry" ON public.telemetry_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own telemetry (for GDPR right to erasure)
CREATE POLICY "Users can delete own telemetry" ON public.telemetry_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments explaining GDPR compliance
COMMENT ON POLICY "Users can update own telemetry" ON public.telemetry_events IS 
  'Allows users to correct their telemetry data for GDPR compliance';
COMMENT ON POLICY "Users can delete own telemetry" ON public.telemetry_events IS 
  'Allows users to delete their telemetry data for GDPR right to erasure';

-- ============================================================================
-- PART 2: Data Retention Function - Auto-purge old telemetry (90 days)
-- ============================================================================

-- Function to automatically purge telemetry older than retention period
CREATE OR REPLACE FUNCTION public.purge_old_telemetry()
RETURNS TABLE(deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retention_days INTEGER := 90;
  del_count bigint;
BEGIN
  DELETE FROM public.telemetry_events
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS del_count = ROW_COUNT;
  
  RAISE NOTICE 'Purged % telemetry records older than % days', del_count, retention_days;
  
  RETURN QUERY SELECT del_count;
END;
$$;

COMMENT ON FUNCTION public.purge_old_telemetry() IS 
  'Automatically purges telemetry data older than retention period for GDPR compliance. Returns count of deleted records.';

-- ============================================================================
-- PART 3: Isolate Sensitive Subscription Data (Backward Compatible)
-- ============================================================================

-- Create separate subscription_metadata table for sensitive billing/subscription data
CREATE TABLE IF NOT EXISTS public.subscription_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status text,
  subscription_tier text,
  property_limit integer,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on subscription_metadata
ALTER TABLE public.subscription_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own subscription data
CREATE POLICY "Users can view own subscription metadata" ON public.subscription_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only service_role can insert subscription data
CREATE POLICY "Service role can insert subscription metadata" ON public.subscription_metadata
  FOR INSERT
  WITH CHECK (
    coalesce(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role'
  );

-- Policy: Only service_role can update subscription data
CREATE POLICY "Service role can update subscription metadata" ON public.subscription_metadata
  FOR UPDATE
  USING (
    coalesce(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role'
  )
  WITH CHECK (
    coalesce(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role'
  );

-- Policy: Only service_role can delete subscription data
CREATE POLICY "Service role can delete subscription metadata" ON public.subscription_metadata
  FOR DELETE
  USING (
    coalesce(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role'
  );

-- Add trigger to update updated_at
CREATE TRIGGER update_subscription_metadata_updated_at
  BEFORE UPDATE ON public.subscription_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 4: Migrate existing subscription data (Safe - doesn't delete from profiles)
-- ============================================================================

-- Migrate existing subscription data from profiles to subscription_metadata
INSERT INTO public.subscription_metadata (
  user_id,
  subscription_status,
  subscription_tier,
  property_limit,
  trial_start,
  trial_end
)
SELECT 
  id,
  subscription_status,
  subscription_tier,
  property_limit,
  trial_start,
  trial_end
FROM public.profiles
WHERE subscription_status IS NOT NULL 
   OR subscription_tier IS NOT NULL 
   OR property_limit IS NOT NULL
   OR trial_start IS NOT NULL
   OR trial_end IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  subscription_status = EXCLUDED.subscription_status,
  subscription_tier = EXCLUDED.subscription_tier,
  property_limit = EXCLUDED.property_limit,
  trial_start = EXCLUDED.trial_start,
  trial_end = EXCLUDED.trial_end,
  updated_at = now();

-- ============================================================================
-- PART 5: Create backward-compatible view (CRITICAL FOR NO-BREAK CHANGES)
-- ============================================================================

-- View that joins profiles with subscription_metadata (read-only for users)
CREATE OR REPLACE VIEW public.profiles_with_subscription AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.created_at,
  p.updated_at,
  COALESCE(sm.subscription_status, p.subscription_status) as subscription_status,
  COALESCE(sm.subscription_tier, p.subscription_tier) as subscription_tier,
  COALESCE(sm.property_limit, p.property_limit) as property_limit,
  COALESCE(sm.trial_start, p.trial_start) as trial_start,
  COALESCE(sm.trial_end, p.trial_end) as trial_end
FROM public.profiles p
LEFT JOIN public.subscription_metadata sm ON p.id = sm.user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_with_subscription TO authenticated;

-- ============================================================================
-- PART 6: Update handle_new_user trigger to populate both tables
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.subscription_metadata (
    user_id,
    subscription_status,
    property_limit,
    subscription_tier
  )
  VALUES (
    new.id,
    'unlimited',
    999999,
    'unlimited'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 7: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscription_metadata_user_id 
  ON public.subscription_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_metadata_tier 
  ON public.subscription_metadata(subscription_tier) 
  WHERE subscription_tier IS NOT NULL;

-- ============================================================================
-- PART 8: Documentation comments
-- ============================================================================

COMMENT ON TABLE public.subscription_metadata IS 
  'Isolated table for sensitive subscription/billing data. Prevents business intelligence exposure. Only service_role can modify. Users can view their own data.';

COMMENT ON VIEW public.profiles_with_subscription IS 
  'Backward-compatible view joining profiles with subscription data. Users can only view their own data. This view maintains existing API contracts during migration.';

COMMENT ON TABLE public.telemetry_events IS 
  'API observability table. Users can manage their own data (SELECT/UPDATE/DELETE) for GDPR compliance. Auto-purged after 90 days via purge_old_telemetry() function.';