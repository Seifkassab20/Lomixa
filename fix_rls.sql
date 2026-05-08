-- Fix for Hospitals Table
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hospitals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.hospitals;
DROP POLICY IF EXISTS "Admin and Owner Access" ON public.hospitals;
DROP POLICY IF EXISTS "Allow All For Now" ON public.hospitals;

CREATE POLICY "Allow All For Now" 
ON public.hospitals 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- Fix for Pharma Companies Table (Since Admin rejects them too)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.pharma_companies;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.pharma_companies;
DROP POLICY IF EXISTS "Admin and Owner Access" ON public.pharma_companies;
DROP POLICY IF EXISTS "Allow All For Now" ON public.pharma_companies;

CREATE POLICY "Allow All For Now" 
ON public.pharma_companies 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);
