-- ============================================================================
-- SECURITY FIX: Clean up confusing storage policies
-- ============================================================================
-- Issue: 13 storage policies use 'TO public' but require 'auth.role() = authenticated'
-- Impact: Code quality issue - policies are confusing but don't grant unintended access
-- Fix: Drop confusing policies and replace with properly scoped authenticated policies
-- ============================================================================

-- Drop all 13 confusing policies that use 'TO public' with 'auth.role() = authenticated'
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload reports" ON storage.objects;

-- Create properly scoped policies using 'TO authenticated' with user folder access
-- Inspection Images Policies
CREATE POLICY "Authenticated users can view inspection images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can upload inspection images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update inspection images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete inspection images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Property Images Policies
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Reports Policies
CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Log the security fix
INSERT INTO security_audit_logs (
  user_id,
  action,
  resource,
  success,
  metadata
) VALUES (
  NULL,
  'storage_policy_cleanup',
  'storage.objects',
  true,
  jsonb_build_object(
    'fixed', 'replaced_confusing_policies',
    'policies_dropped', 13,
    'policies_created', 10,
    'buckets_affected', ARRAY['inspection-images', 'property-images', 'reports'],
    'improvement', 'Clear TO authenticated with user-scoped access',
    'applied_date', now()
  )
);

-- Verification
DO $$
DECLARE
  public_policy_count INTEGER;
  auth_policy_count INTEGER;
BEGIN
  -- Check no 'TO public' policies remain for our buckets
  SELECT COUNT(*) INTO public_policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND 'public' = ANY(string_to_array(trim(both '{}' from roles::text), ','))
    AND policyname LIKE '%inspection%' OR policyname LIKE '%property%' OR policyname LIKE '%report%';
  
  IF public_policy_count > 0 THEN
    RAISE WARNING 'Still have % confusing public policies', public_policy_count;
  ELSE
    RAISE NOTICE 'Success: No confusing public policies remain';
  END IF;
  
  -- Verify authenticated policies were created
  SELECT COUNT(*) INTO auth_policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND 'authenticated' = ANY(string_to_array(trim(both '{}' from roles::text), ','))
    AND (policyname LIKE '%inspection%' OR policyname LIKE '%property%' OR policyname LIKE '%report%');
  
  IF auth_policy_count >= 10 THEN
    RAISE NOTICE 'Success: Created % properly scoped authenticated policies', auth_policy_count;
  ELSE
    RAISE WARNING 'Expected 10+ authenticated policies, found %', auth_policy_count;
  END IF;
END $$;