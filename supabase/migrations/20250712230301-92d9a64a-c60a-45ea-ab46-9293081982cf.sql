-- Update existing profiles to remove limitations
UPDATE public.profiles 
SET 
  subscription_status = 'unlimited',
  subscription_tier = 'unlimited',
  property_limit = 999999,
  trial_end = NULL
WHERE subscription_status IS NOT NULL;

-- Update the handle_new_user function to create unlimited users by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, trial_start, trial_end, subscription_status, property_limit, subscription_tier)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    NULL,
    NULL,
    'unlimited',
    999999,
    'unlimited'
  );
  RETURN NEW;
END;
$function$