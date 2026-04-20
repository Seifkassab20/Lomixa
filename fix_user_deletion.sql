-- This script fixes the error when deleting a user by adding ON DELETE CASCADE 
-- to all foreign keys that reference auth.users.
-- This ensures that when a user is deleted from auth.users, all related records 
-- in the public schema are also deleted automatically.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all foreign key constraints in the public schema that reference auth.users
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
            AND ccu.column_name = 'id'
    ) LOOP
        -- Drop the existing constraint
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        
        -- Add the constraint back with ON DELETE CASCADE
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' ||
                ' REFERENCES auth.users(id) ON DELETE CASCADE';
                
        RAISE NOTICE 'Updated constraint % on table % to CASCADE on delete', r.constraint_name, r.table_name;
    END LOOP;
END $$;
