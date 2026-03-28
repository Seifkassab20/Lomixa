-- REFINED Final Migration for Monetary Balance System (SAR)

-- 1. Correct Bundle ID column (Was uuid, must be text or id strings will fail)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundle_requests' AND column_name = 'bundle_id' AND data_type = 'uuid') THEN
        ALTER TABLE public.bundle_requests DROP COLUMN bundle_id;
    END IF;
END $$;
ALTER TABLE public.bundle_requests ADD COLUMN IF NOT EXISTS bundle_id text;

-- 2. Organizations & Personnel: Rename credits to balance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharma_companies' AND column_name = 'credits') THEN
        ALTER TABLE public.pharma_companies RENAME COLUMN credits TO balance;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reps' AND column_name = 'credits') THEN
        ALTER TABLE public.sales_reps RENAME COLUMN credits TO balance;
    END IF;
END $$;

-- 3. Bundle Requests: Ensure balance field exists 
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundle_requests' AND column_name = 'credits') THEN
        ALTER TABLE public.bundle_requests RENAME COLUMN credits TO balance;
    END IF;
END $$;

-- 4. Transactions: Update terminology
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'credits_added') THEN
        ALTER TABLE public.transactions RENAME COLUMN credits_added TO funds_added;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount_egp') THEN
        ALTER TABLE public.transactions RENAME COLUMN amount_egp TO amount_sar;
    END IF;
END $$;
