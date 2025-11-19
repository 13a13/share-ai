-- ============================================================================
-- SECURITY FIX: Remove conflicting public policies from inspection-images bucket
-- ============================================================================
-- Issue: inspection-images bucket is marked private but has public access policies
-- Impact: Anyone can read, modify, and delete sensitive inspection images
-- Fix: Remove all public access policies, keep only user-scoped policies
-- ============================================================================

-- Remove dangerous public access policies
DROP POLICY IF EXISTS "Public Access - Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read inspection images" ON storage.objects;

-- Verify bucket is private (should already be set, but enforce it)
UPDATE storage.buckets 
SET public = false 
WHERE name = 'inspection-images';

-- Log the security fix
DO $$
BEGIN
  -- Insert audit log if security_audit_logs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      action,
      resource,
      success,
      metadata
    ) VALUES (
      NULL,
      'storage_security_fix',
      'inspection-images',
      true,
      jsonb_build_object(
        'fix_type', 'removed_public_policies',
        'policies_removed', ARRAY[
          'Public Access - Select',
          'Public Access - Update', 
          'Public Access - Delete',
          'Public Access - Upload',
          'Public can read inspection images'
        ],
        'applied_date', now()
      )
    );
  END IF;
END $$;

-- Verification: List remaining policies on storage.objects for inspection-images bucket
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%inspection%';

  RAISE NOTICE 'Remaining inspection-images policies: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE WARNING 'No inspection-images policies found - ensure user-scoped policies exist';
  END IF;
END $$;