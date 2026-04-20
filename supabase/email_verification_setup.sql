-- 1. Ensure user_security table has correct fields
-- This table is already created in email_schema.sql but we ensure it matches our needs.
CREATE TABLE IF NOT EXISTS public.user_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT, -- Stores hashed token
    reset_token TEXT,        -- Stores hashed token
    token_expiry TIMESTAMP WITH TIME ZONE,
    last_resend_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Trigger to automatically create security record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_security (user_id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (user_id) DO UPDATE SET email = new.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;

CREATE TRIGGER on_auth_user_created_security
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_security();

-- 3. RLS Policies
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to view own security settings" ON public.user_security;
CREATE POLICY "Allow users to view own security settings" 
ON public.user_security FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Helper function to check if email is verified (can be used in RLS of other tables)
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
  SELECT email_verified FROM public.user_security WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
