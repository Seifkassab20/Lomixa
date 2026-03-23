-- 1. Ensure columns exist on Hospitals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='type') THEN
        ALTER TABLE public.hospitals ADD COLUMN type text DEFAULT 'hospital';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='is_active') THEN
        ALTER TABLE public.hospitals ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='phone') THEN
        ALTER TABLE public.hospitals ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='role') THEN
        ALTER TABLE public.hospitals ADD COLUMN role text DEFAULT 'hospital';
    END IF;
END $$;

-- 2. Ensure columns exist on Pharma Companies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharma_companies' AND column_name='is_active') THEN
        ALTER TABLE public.pharma_companies ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharma_companies' AND column_name='is_verified') THEN
        ALTER TABLE public.pharma_companies ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharma_companies' AND column_name='phone') THEN
        ALTER TABLE public.pharma_companies ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharma_companies' AND column_name='role') THEN
        ALTER TABLE public.pharma_companies ADD COLUMN role text DEFAULT 'pharma';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pharma_companies' AND column_name='custom_bundles') THEN
        ALTER TABLE public.pharma_companies ADD COLUMN custom_bundles text;
    END IF;
END $$;

-- 3. Ensure columns exist on Doctors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='is_active') THEN
        ALTER TABLE public.doctors ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='is_verified') THEN
        ALTER TABLE public.doctors ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='role') THEN
        ALTER TABLE public.doctors ADD COLUMN role text DEFAULT 'doctor';
    END IF;
END $$;

-- 4. Ensure columns exist on Sales Reps
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_reps' AND column_name='is_active') THEN
        ALTER TABLE public.sales_reps ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_reps' AND column_name='is_verified') THEN
        ALTER TABLE public.sales_reps ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_reps' AND column_name='role') THEN
        ALTER TABLE public.sales_reps ADD COLUMN role text DEFAULT 'rep';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_reps' AND column_name='credits') THEN
        ALTER TABLE public.sales_reps ADD COLUMN credits integer DEFAULT 0;
    END IF;
END $$;

-- 5. Create new tables if missing
CREATE TABLE IF NOT EXISTS public.bundle_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharma_id uuid REFERENCES public.pharma_companies(id) ON DELETE CASCADE,
    pharma_name text,
    bundle_name text,
    credits integer,
    price integer,
    card_number text,
    card_holder text,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharma_id uuid REFERENCES public.pharma_companies(id) ON DELETE CASCADE,
    bundle_name text,
    credits_added integer,
    amount_egp integer,
    date text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable RLS and setup policies safely
ALTER TABLE public.bundle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'bundle_requests') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.bundle_requests FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'transactions') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true);
    END IF;
END $$;
