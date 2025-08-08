-- Safe Database Cleanup Migration
-- This migration handles RLS policies and dependencies properly

-- 1. First, add the missing 'favorite' column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;

-- 2. Update any existing NULL values in favorite column to FALSE
UPDATE public.user_books 
SET favorite = FALSE 
WHERE favorite IS NULL;

-- 3. Add NOT NULL constraint to favorite column
ALTER TABLE public.user_books 
ALTER COLUMN favorite SET NOT NULL;

-- 4. Create index on favorite column for performance
CREATE INDEX IF NOT EXISTS idx_user_books_favorite 
ON public.user_books(user_id, favorite) 
WHERE favorite = TRUE;

-- 5. Check what RLS policies exist and drop the problematic one
DO $$ 
DECLARE
    policy_exists boolean;
BEGIN
    -- Check if the policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_books' 
        AND policyname = 'Users can view public books of others'
    ) INTO policy_exists;
    
    -- Drop the policy if it exists
    IF policy_exists THEN
        DROP POLICY "Users can view public books of others" ON public.user_books;
    END IF;
END $$;

-- 6. Now we can safely remove the unused columns
ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_price;

ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_url;

ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS is_private;

ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS personal_rating;

-- 7. Add missing columns that might be referenced but not in schema
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND table_schema = 'public' 
        AND column_name = 'google_books_url'
    ) THEN
        ALTER TABLE public.books ADD COLUMN google_books_url TEXT;
    END IF;
END $$;

-- 8. Recreate a simpler RLS policy that doesn't depend on is_private (if needed)
-- This policy allows users to see their own books and public activities
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    -- Check if RLS is enabled on user_books
    SELECT row_security FROM pg_class 
    WHERE relname = 'user_books' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;
    
    -- If RLS is enabled, create a basic policy
    IF rls_enabled THEN
        -- Allow users to see their own books
        CREATE POLICY "Users can manage their own books" ON public.user_books
        FOR ALL USING (auth.uid() = user_id);
        
        -- Allow users to see other users' books for social features
        -- (since we removed is_private, we'll assume all books are visible)
        CREATE POLICY "Users can view others books" ON public.user_books
        FOR SELECT USING (true);
    END IF;
EXCEPTION 
    WHEN duplicate_object THEN 
        -- Policy already exists, ignore
        NULL;
END $$;

-- 9. Optimize the database with some useful indexes
CREATE INDEX IF NOT EXISTS idx_user_books_status 
ON public.user_books(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_books_updated_at 
ON public.user_books(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_books_title 
ON public.books USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_authors_name 
ON public.authors USING gin(to_tsvector('english', name));

-- Migration completed successfully
SELECT 'Safe database cleanup migration completed' as status;