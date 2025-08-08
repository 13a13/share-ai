-- 1. CRITICAL: Lock down storage buckets by making them private
-- Update existing public buckets to be private (except 'share' which may need to stay public for intentional sharing)
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('inspection-images', 'property-images', 'reports');

-- 2. Create comprehensive storage policies for private buckets
-- Policy for inspection-images bucket
CREATE POLICY "Users can view their own inspection images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'inspection-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own inspection images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'inspection-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own inspection images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'inspection-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own inspection images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'inspection-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for property-images bucket
CREATE POLICY "Users can view their own property images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for reports bucket
CREATE POLICY "Users can view their own reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own reports" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own reports" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Create an admin function to invalidate all user sessions
CREATE OR REPLACE FUNCTION public.admin_invalidate_user_sessions(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to invalidate their own sessions
  IF auth.uid() = target_user_id THEN
    -- Mark all sessions as inactive in our tracking table
    UPDATE public.user_sessions 
    SET is_active = FALSE, 
        updated_at = NOW()
    WHERE user_id = target_user_id 
    AND is_active = TRUE;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Can only invalidate your own sessions';
  END IF;
END;
$$;