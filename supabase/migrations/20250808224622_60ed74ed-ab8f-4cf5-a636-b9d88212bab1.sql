-- Lock down inspection-images bucket: make it private and add policies for per-user folder access

-- Make bucket private (id and name are the same)
UPDATE storage.buckets
SET public = false
WHERE id = 'inspection-images';

-- Policies on storage.objects for inspection-images
-- Allow authenticated users to SELECT/INSERT/UPDATE/DELETE only within their own user-id prefixed folder
CREATE POLICY "Users can view own inspection images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own inspection images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own inspection images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own inspection images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
