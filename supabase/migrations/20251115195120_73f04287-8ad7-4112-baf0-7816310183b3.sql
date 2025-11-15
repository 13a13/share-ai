-- Step 0: Create telemetry_events table for observability
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation text NOT NULL,
  resource text NOT NULL,
  duration_ms integer,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_class text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_operation ON public.telemetry_events(operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_errors ON public.telemetry_events(status) WHERE status = 'error';
CREATE INDEX IF NOT EXISTS idx_telemetry_user ON public.telemetry_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_resource ON public.telemetry_events(resource, created_at DESC);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own telemetry
CREATE POLICY "Users can view own telemetry" ON public.telemetry_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert telemetry (any authenticated user can log)
CREATE POLICY "Authenticated users can insert telemetry" ON public.telemetry_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.telemetry_events IS 'API observability - tracks all API operations for performance monitoring and error tracking';