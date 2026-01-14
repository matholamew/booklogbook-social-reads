-- Add current_page column to user_books for progress tracking
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;

-- Add a check constraint to ensure current_page is non-negative
ALTER TABLE public.user_books 
ADD CONSTRAINT current_page_non_negative CHECK (current_page >= 0);