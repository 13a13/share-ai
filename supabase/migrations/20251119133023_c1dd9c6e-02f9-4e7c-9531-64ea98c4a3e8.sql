-- Migration: Complete storage policy consolidation - Remove duplicate INSERT policies

-- =============================================
-- Drop the 5 old duplicate INSERT policies on inspection-images
-- Keep only: authenticated_users_insert_inspection_images
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated upload to inspection-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Insert own slug folder (inspection-images)" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own inspection images" ON storage.objects;

-- After this migration, inspection-images will have exactly 4 policies:
-- 1. authenticated_users_select_inspection_images (SELECT)
-- 2. authenticated_users_insert_inspection_images (INSERT)
-- 3. authenticated_users_update_inspection_images (UPDATE)
-- 4. authenticated_users_delete_inspection_images (DELETE)