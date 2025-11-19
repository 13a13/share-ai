
-- Migration: Consolidate duplicate storage policies and remove unused share bucket

-- =============================================
-- Part 1: Drop all 15 duplicate policies on inspection-images bucket
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated delete from inspection-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated list inspection-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in inspection-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Delete own slug folder (inspection-images)" ON storage.objects;
DROP POLICY IF EXISTS "Read own slug folder (inspection-images)" ON storage.objects;
DROP POLICY IF EXISTS "Update own slug folder (inspection-images)" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own inspection images" ON storage.objects;

-- =============================================
-- Part 2: Create 4 consolidated, properly scoped policies
-- =============================================

-- Policy 1: SELECT - Users can view their own inspection images
CREATE POLICY "authenticated_users_select_inspection_images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-images' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 2: INSERT - Users can upload inspection images to their folder
CREATE POLICY "authenticated_users_insert_inspection_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 3: UPDATE - Users can update their own inspection images
CREATE POLICY "authenticated_users_update_inspection_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 4: DELETE - Users can delete their own inspection images
CREATE POLICY "authenticated_users_delete_inspection_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =============================================
-- Part 3: Remove unused public share bucket
-- =============================================

-- Delete the share bucket (appears unused and is publicly accessible)
DELETE FROM storage.buckets WHERE name = 'share';
