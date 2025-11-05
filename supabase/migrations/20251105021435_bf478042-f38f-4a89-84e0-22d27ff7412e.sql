-- Remove UPDATE policies on books and authors tables to prevent data pollution
-- Users can still INSERT new books/authors, but cannot modify existing ones

DROP POLICY IF EXISTS "Authenticated users can update books" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can update authors" ON public.authors;