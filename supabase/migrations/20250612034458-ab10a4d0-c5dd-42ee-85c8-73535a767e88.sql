
-- Create the inspection-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-images', 'inspection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the inspection-images bucket
-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload inspection images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'inspection-images' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public read access to inspection images
CREATE POLICY "Allow public read access to inspection images" ON storage.objects
FOR SELECT USING (bucket_id = 'inspection-images');

-- Policy to allow authenticated users to update their own inspection images
CREATE POLICY "Allow authenticated users to update inspection images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'inspection-images' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete inspection images
CREATE POLICY "Allow authenticated users to delete inspection images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'inspection-images' 
  AND auth.role() = 'authenticated'
);
