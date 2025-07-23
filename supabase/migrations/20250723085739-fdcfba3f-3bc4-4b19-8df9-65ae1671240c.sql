-- Fix database function security by adding explicit search_path settings
-- Update existing functions to be more secure

-- Update the update_updated_at_column function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Update the set_room_name_on_insert function with explicit search_path
CREATE OR REPLACE FUNCTION public.set_room_name_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    IF NEW.type IS NOT NULL AND trim(NEW.type) <> '' THEN
      NEW.name := NEW.type;
    ELSE
      NEW.name := 'room';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update the handle_new_user function with explicit search_path  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$function$;

-- Create a function to get current user role securely (prevents RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT subscription_tier FROM public.profiles WHERE id = auth.uid();
$$;

-- Create audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs (admins would need special access)
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to log security events securely
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    resource,
    success,
    error_message,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_success,
    p_error_message,
    p_metadata
  );
END;
$$;

-- Create session management table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$;