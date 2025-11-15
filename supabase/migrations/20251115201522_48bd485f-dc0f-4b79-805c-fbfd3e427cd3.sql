-- Fix security definer view issue
-- This ensures the view uses the permissions of the calling user, not the view creator
-- Critical for preventing privilege escalation

ALTER VIEW public.profiles_with_subscription SET (security_invoker = true);