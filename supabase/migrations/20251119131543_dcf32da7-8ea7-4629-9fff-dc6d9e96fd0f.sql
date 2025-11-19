-- ============================================================================
-- SECURITY FIX: Secure property-images bucket
-- ============================================================================
-- Issue: property-images bucket is public with anonymous SELECT access
-- Impact: 8 property photos exposed to anyone without authentication
-- Properties affected: 1 property using this bucket
-- ============================================================================

-- Make property-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'property-images';

-- Remove public read policy
DROP POLICY IF EXISTS "Public can read property images" ON storage.objects;

-- Add user-scoped policy for authenticated access
CREATE POLICY "Users can view own property images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-images'
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
  'storage_security_fix',
  'property-images',
  true,
  jsonb_build_object(
    'fixed', 'removed_public_access',
    'files_protected', 8,
    'properties_affected', 1,
    'applied_date', now()
  )
);

-- Verification
DO $$
DECLARE
  is_public BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check bucket is private
  SELECT public INTO is_public
  FROM storage.buckets
  WHERE name = 'property-images';
  
  IF is_public THEN
    RAISE WARNING 'property-images bucket is still public!';
  ELSE
    RAISE NOTICE 'Success: property-images bucket is now private';
  END IF;
  
  -- Check no public policies remain
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%property%'
    AND 'public' = ANY(string_to_array(trim(both '{}' from roles::text), ','));
  
  IF policy_count > 0 THEN
    RAISE WARNING 'Still have % public property policies', policy_count;
  ELSE
    RAISE NOTICE 'Success: No public property-images policies remain';
  END IF;
END $$;