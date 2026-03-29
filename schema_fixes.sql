-- Comprehensive Schema Fixes for Lomixa based on Frontend Requirements

-- 1. Fixes for Doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS role text;

-- 2. Fixes for Hospitals table
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS balance integer default 0;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS documents text;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS role text;

-- 3. Fixes for Pharma Companies table
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS documents text;
ALTER TABLE public.pharma_companies ADD COLUMN IF NOT EXISTS role text;

-- 4. Fixes for Sales Representatives table
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS role_title text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS target_specialties text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS products text;
ALTER TABLE public.sales_reps ADD COLUMN IF NOT EXISTS role text;

-- Note: The frontend uses these fields extensively during registration and profile updates.
-- Applying this migration will resolve the PGRST204 errors (Could not find the column in the schema cache).
