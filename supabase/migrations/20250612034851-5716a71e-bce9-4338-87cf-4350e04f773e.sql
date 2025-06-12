
-- First, let's make sure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-images', 'inspection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to upload inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update inspection images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete inspection images" ON storage.objects;

-- Create comprehensive storage policies for the inspection-images bucket
-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated upload to inspection-images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'inspection-images');

-- Policy to allow public read access to inspection images
CREATE POLICY "Allow public read from inspection-images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'inspection-images');

-- Policy to allow authenticated users to update their inspection images
CREATE POLICY "Allow authenticated update in inspection-images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'inspection-images');

-- Policy to allow authenticated users to delete inspection images
CREATE POLICY "Allow authenticated delete from inspection-images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'inspection-images');

-- Policy to allow authenticated users to list objects in inspection-images bucket
CREATE POLICY "Allow authenticated list inspection-images" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'inspection-images');
