-- 1) Prevent privilege escalation on profiles sensitive fields
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
       OR (NEW.property_limit IS DISTINCT FROM OLD.property_limit)
       OR (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) THEN
      -- Allow only service_role to change these fields
      IF coalesce(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role' <> 'service_role' THEN
        RAISE EXCEPTION 'Insufficient privileges to modify subscription fields';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_sensitive_profile_changes ON public.profiles;
CREATE TRIGGER trg_prevent_sensitive_profile_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_profile_changes();

-- 2) Storage policies for inspection-images bucket
-- These policies restrict API access so only the authenticated user whose UUID is the first folder in the object path can access their files.
-- Example path enforced by app: <user_id>/<property>/<room>/<component>/<filename>

-- SELECT
DROP POLICY IF EXISTS "Users can view their own inspection images" ON storage.objects;
CREATE POLICY "Users can view their own inspection images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT
DROP POLICY IF EXISTS "Users can upload their own inspection images" ON storage.objects;
CREATE POLICY "Users can upload their own inspection images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE
DROP POLICY IF EXISTS "Users can update their own inspection images" ON storage.objects;
CREATE POLICY "Users can update their own inspection images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE
DROP POLICY IF EXISTS "Users can delete their own inspection images" ON storage.objects;
CREATE POLICY "Users can delete their own inspection images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
