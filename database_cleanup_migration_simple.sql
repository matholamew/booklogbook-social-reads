-- Simple Database Cleanup Migration
-- Compatible with older PostgreSQL versions

-- 1. Add the missing 'favorite' column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;

-- 2. Update any existing NULL values in favorite column to FALSE
UPDATE public.user_books 
SET favorite = FALSE 
WHERE favorite IS NULL;

-- 3. Add NOT NULL constraint to favorite column
ALTER TABLE public.user_books 
ALTER COLUMN favorite SET NOT NULL;

-- 4. Drop the problematic RLS policy first
DROP POLICY IF EXISTS "Users can view public books of others" ON public.user_books;

-- 5. Remove unused columns from books table
ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_price;

ALTER TABLE public.books 
DROP COLUMN IF EXISTS amazon_url;

-- 6. Remove unused columns from user_books table  
ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS is_private;

ALTER TABLE public.user_books 
DROP COLUMN IF EXISTS personal_rating;

-- 7. Add google_books_url column if it doesn't exist
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

-- 8. Create basic RLS policies (replace the old one)
-- Allow users to manage their own books
CREATE POLICY IF NOT EXISTS "Users can manage their own books" ON public.user_books
FOR ALL USING (auth.uid() = user_id);

-- Allow users to view others' books (since we removed privacy controls)
CREATE POLICY IF NOT EXISTS "Users can view others books" ON public.user_books
FOR SELECT USING (true);

-- 9. Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_books_favorite 
ON public.user_books(user_id, favorite) 
WHERE favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_books_status 
ON public.user_books(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_books_updated_at 
ON public.user_books(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_books_title 
ON public.books USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_authors_name 
ON public.authors USING gin(to_tsvector('english', name));

-- Migration completed
SELECT 'Simple database cleanup migration completed successfully' as status;