-- Create helper slug functions and policies to allow slug-based folder access in inspection-images

-- 1) Helper: slugify text -> text
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '', 'g'));
$$;

-- 2) Helper: compute current user's account slug (from profiles first_name + last_name)
CREATE OR REPLACE FUNCTION public.user_account_slug()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn text;
  ln text;
  slug text;
BEGIN
  SELECT coalesce(trim(first_name), ''), coalesce(trim(last_name), '')
  INTO fn, ln
  FROM public.profiles
  WHERE id = auth.uid();

  slug := public.slugify(fn || ln);

  IF slug IS NULL OR slug = '' THEN
    -- Fallback to a short uid-based slug to avoid empty values
    slug := substring(replace(cast(auth.uid() as text), '-', '') from 1 for 12);
  END IF;

  RETURN slug;
END;
$$;

-- 3) RLS Policies for storage.objects on the private bucket 'inspection-images'
--    Allow authenticated users to operate only within their slug top-level folder

-- READ
CREATE POLICY "Read own slug folder (inspection-images)"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND coalesce((storage.foldername(name))[1], '') = public.user_account_slug()
);

-- INSERT
CREATE POLICY "Insert own slug folder (inspection-images)"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-images'
  AND coalesce((storage.foldername(name))[1], '') = public.user_account_slug()
);

-- UPDATE
CREATE POLICY "Update own slug folder (inspection-images)"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND coalesce((storage.foldername(name))[1], '') = public.user_account_slug()
)
WITH CHECK (
  bucket_id = 'inspection-images'
  AND coalesce((storage.foldername(name))[1], '') = public.user_account_slug()
);

-- DELETE
CREATE POLICY "Delete own slug folder (inspection-images)"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-images'
  AND coalesce((storage.foldername(name))[1], '') = public.user_account_slug()
);
