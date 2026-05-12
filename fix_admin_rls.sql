-- Comprehensive Universal Schema Initialization & Row Level Security (RLS) Configuration
-- Run this script in your Supabase SQL Editor to establish missing tables and enable seamless synchronization.

-- 1. Create missing target tables to ensure RLS statements do not fail
CREATE TABLE IF NOT EXISTS public.hospitals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    hospital_id text,
    hospital_name text,
    name text,
    specialty text,
    experience_years int,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    balance numeric DEFAULT 0,
    location jsonb,
    avatar text,
    title text,
    rejection_reason text,
    approval_status text,
    reviewed_by text,
    reviewed_at timestamptz,
    role text,
    type text DEFAULT 'hospital',
    documents jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pharma_companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    name text,
    email text,
    phone text,
    location jsonb,
    avatar text,
    balance numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    custom_bundles jsonb,
    documents jsonb,
    rejection_reason text,
    approval_status text,
    reviewed_by text,
    reviewed_at timestamptz,
    role text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    hospital_id text,
    hospital_name text,
    name text,
    specialty text,
    experience_years int,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    balance numeric DEFAULT 0,
    location jsonb,
    avatar text,
    title text,
    rejection_reason text,
    approval_status text,
    reviewed_by text,
    reviewed_at timestamptz,
    role text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_reps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    pharma_id text,
    pharma_name text,
    name text,
    email text,
    phone text,
    target int DEFAULT 0,
    visits_this_month int DEFAULT 0,
    balance numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    location jsonb,
    avatar text,
    first_name text,
    last_name text,
    role_title text,
    target_specialties jsonb,
    products jsonb,
    subscription jsonb,
    rejection_reason text,
    approval_status text,
    reviewed_by text,
    reviewed_at timestamptz,
    role text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visits (
    id text PRIMARY KEY,
    doctor_id text,
    doctor_name text,
    rep_id text,
    rep_name text,
    rep_user_id text,
    pharma_id text,
    pharma_name text,
    hospital_id text,
    hospital_name text,
    date text,
    time text,
    visit_type text,
    status text,
    duration_minutes int,
    price numeric,
    notes text,
    outcome_notes text,
    cancelled_by_rep boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id text PRIMARY KEY,
    doctor_id text,
    doctor_user_id text,
    rep_id text,
    rep_user_id text,
    start_time text,
    end_time text,
    status text,
    meeting_id text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY,
    type text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'SAR',
    from_id text,
    from_name text,
    to_id text,
    to_name text,
    related_id text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
    id text PRIMARY KEY,
    doctor_id text,
    date text,
    time text,
    appointment_type text,
    duration int,
    is_booked boolean DEFAULT false,
    price numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ratings (
    id text PRIMARY KEY,
    visit_id text,
    doctor_id text,
    rep_id text,
    rating numeric,
    comment text,
    type text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id text PRIMARY KEY,
    user_id text,
    title text,
    message text,
    type text,
    read boolean DEFAULT false,
    related_id text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bundle_requests (
    id text PRIMARY KEY,
    pharma_id text,
    pharma_name text,
    bundle_id text,
    bundle_name text,
    balance numeric,
    price numeric,
    card_number text,
    card_holder text,
    status text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_finance (
    id text PRIMARY KEY,
    admin_balance numeric DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- 2. Ensure RLS is enabled for safety but completely open for synchronization
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_finance ENABLE ROW LEVEL SECURITY;

-- Helper macro: Drop existing policies to avoid policy conflicts or restrictive rules
DO $$ 
DECLARE 
    t text;
    p text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
        END LOOP;
    END LOOP;
END $$;

-- Recreate universal permissive policies for all core tables to public
CREATE POLICY "Universal Permissive Access" ON public.hospitals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.pharma_companies FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.doctors FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.sales_reps FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.visits FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.appointments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.transactions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.availability_slots FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.ratings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.bundle_requests FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Universal Permissive Access" ON public.platform_finance FOR ALL TO public USING (true) WITH CHECK (true);
