-- Enforce strict owner-only history visibility
-- user_books: remove followed-user visibility and keep owner-only SELECT
DROP POLICY IF EXISTS "Users can view own or followed users books" ON public.user_books;

DROP POLICY IF EXISTS "Users can view their own books" ON public.user_books;
CREATE POLICY "Users can view their own books"
ON public.user_books
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- activities: remove followed-user visibility and keep owner-only SELECT
DROP POLICY IF EXISTS "Users can view activities of people they follow or their own" ON public.activities;

CREATE POLICY "Users can view their own activities"
ON public.activities
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);