-- This script applies a universal permissive policy to allow Admins (and any authenticated user) to update records
-- without triggering the "new row violates row-level security policy" error.

-- 1. Ensure RLS is enabled
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if we know their typical names (optional clean-up)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hospitals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.hospitals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.hospitals;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.pharma_companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pharma_companies;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.pharma_companies;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.doctors;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.doctors;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.sales_reps;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.sales_reps;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.sales_reps;

-- 3. Create universal permissive policies
CREATE POLICY "Universal_Access_Policy_Hospitals" 
ON public.hospitals 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Universal_Access_Policy_Pharma" 
ON public.pharma_companies 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Universal_Access_Policy_Doctors" 
ON public.doctors 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Universal_Access_Policy_Reps" 
ON public.sales_reps 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);
