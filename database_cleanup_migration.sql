-- Database Cleanup Migration
-- This migration removes unused columns and adds missing ones

-- 1. First, add the missing 'favorite' column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;

-- 2. Create index on favorite column for performance
CREATE INDEX IF NOT EXISTS idx_user_books_favorite 
ON public.user_books(user_id, favorite) 
WHERE favorite = TRUE;

-- 3. Remove unused columns from books table
ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_price;

ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_url;

-- 4. Remove unused columns from user_books table  
ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS is_private;

ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS personal_rating;

-- 5. Add missing columns that might be referenced but not in schema
-- Check if google_books_url exists, if not add it
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

-- 6. Optimize the database with some useful indexes
CREATE INDEX IF NOT EXISTS idx_user_books_status 
ON public.user_books(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_books_updated_at 
ON public.user_books(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_books_title 
ON public.books USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_authors_name 
ON public.authors USING gin(to_tsvector('english', name));

-- 7. Update any existing NULL values in favorite column to FALSE
UPDATE public.user_books 
SET favorite = FALSE 
WHERE favorite IS NULL;

-- 8. Add NOT NULL constraint to favorite column
ALTER TABLE public.user_books 
ALTER COLUMN favorite SET NOT NULL;

-- Migration completed successfully
SELECT 'Database cleanup migration completed' as status;