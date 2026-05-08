-- Migration to add rejection handling fields
ALTER TABLE hospitals 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE pharma_companies 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE sales_reps 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records based on is_verified
UPDATE hospitals SET approval_status = 'approved' WHERE is_verified = true;
UPDATE pharma_companies SET approval_status = 'approved' WHERE is_verified = true;
UPDATE doctors SET approval_status = 'approved' WHERE is_verified = true;
UPDATE sales_reps SET approval_status = 'approved' WHERE is_verified = true;

UPDATE hospitals SET approval_status = 'rejected' WHERE is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '';
UPDATE pharma_companies SET approval_status = 'rejected' WHERE is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '';
UPDATE doctors SET approval_status = 'rejected' WHERE is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '';
UPDATE sales_reps SET approval_status = 'rejected' WHERE is_verified = false AND rejection_reason IS NOT NULL AND rejection_reason != '';
