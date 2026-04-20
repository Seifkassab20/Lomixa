-- Table for Email Security and Token Management
CREATE TABLE IF NOT EXISTS public.user_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for user_security
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own security status
CREATE POLICY "Allow users to view own security settings" 
ON public.user_security FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- System function / Edge function to bypass RLS will use Service Role Key

-- Setup pg_cron trigger for upcoming meeting reminders (Runs every 10 minutes)
-- Requires pg_cron extension: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('meeting-reminders-job', '*/10 * * * *', $$
--   select net.http_post(
--     url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/meeting-reminders',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
--   );
-- $$);
