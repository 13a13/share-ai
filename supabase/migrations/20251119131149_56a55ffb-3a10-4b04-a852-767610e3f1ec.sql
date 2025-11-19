-- ============================================================================
-- CRITICAL SECURITY FIX: Secure inspection-images and reports buckets
-- ============================================================================
-- Issue 1: inspection-images has public read policy "Allow public read from inspection-images"
-- Issue 2: reports bucket is public and exposes PII (tenant names, addresses, signatures)
-- Impact: Sensitive data accessible to anyone without authentication
-- ============================================================================

-- FIX 1: Remove public read policy from inspection-images bucket
DROP POLICY IF EXISTS "Allow public read from inspection-images" ON storage.objects;

-- FIX 2: Make reports bucket private (CRITICAL - contains PII)
UPDATE storage.buckets 
SET public = false 
WHERE name = 'reports';

-- FIX 3: Remove public read policy from reports bucket
DROP POLICY IF EXISTS "Public can read reports" ON storage.objects;

-- FIX 4: Add authenticated user-only access for reports
CREATE POLICY "Users can view own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Log the critical security fixes
INSERT INTO security_audit_logs (
  user_id,
  action,
  resource,
  success,
  metadata
) VALUES (
  NULL,
  'critical_security_fix',
  'storage_buckets',
  true,
  jsonb_build_object(
    'fixed_buckets', ARRAY['inspection-images', 'reports'],
    'severity', 'CRITICAL',
    'data_types_protected', ARRAY['inspection_photos', 'PII', 'tenant_data'],
    'compliance', ARRAY['GDPR', 'Privacy Laws'],
    'policies_removed', ARRAY[
      'Allow public read from inspection-images',
      'Public can read reports'
    ],
    'applied_date', now()
  )
);

-- Verification: Check remaining public policies
DO $$
DECLARE
  public_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO public_policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND 'public' = ANY(string_to_array(trim(both '{}' from roles::text), ','));
  
  IF public_policy_count > 0 THEN
    RAISE WARNING 'Still have % public storage policies remaining', public_policy_count;
  ELSE
    RAISE NOTICE 'Success: No public storage policies remain';
  END IF;
END $$;