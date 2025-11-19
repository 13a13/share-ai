-- Migration: Fix handle_new_user to handle both name formats
-- This allows the function to work with both 'name'/'full_name' and 'first_name'/'last_name' metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Get the full name from any available field
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    ''
  );
  
  -- Try to get first_name, fallback to parsing the full name
  v_first_name := COALESCE(
    new.raw_user_meta_data->>'first_name',
    NULLIF(SPLIT_PART(v_full_name, ' ', 1), ''),
    ''
  );
  
  -- Try to get last_name, fallback to parsing the full name
  v_last_name := COALESCE(
    new.raw_user_meta_data->>'last_name',
    NULLIF(TRIM(SUBSTRING(v_full_name FROM LENGTH(SPLIT_PART(v_full_name, ' ', 1)) + 2)), ''),
    ''
  );

  -- Insert into profiles with the parsed names
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    v_first_name,
    v_last_name
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert subscription metadata (unlimited for all new users)
  INSERT INTO public.subscription_metadata (
    user_id,
    subscription_status,
    property_limit,
    subscription_tier
  )
  VALUES (
    new.id,
    'unlimited',
    999999,
    'unlimited'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;