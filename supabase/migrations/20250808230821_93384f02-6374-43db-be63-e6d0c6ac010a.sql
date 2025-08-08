-- Fix linter warning: ensure function has fixed search_path
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '', 'g'));
$$;