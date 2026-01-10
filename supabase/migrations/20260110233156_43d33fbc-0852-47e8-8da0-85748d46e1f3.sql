-- Create a trigger function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- If created_by is not set, set it to the current user
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for authors table
DROP TRIGGER IF EXISTS set_authors_created_by ON public.authors;
CREATE TRIGGER set_authors_created_by
    BEFORE INSERT ON public.authors
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Create trigger for books table
DROP TRIGGER IF EXISTS set_books_created_by ON public.books;
CREATE TRIGGER set_books_created_by
    BEFORE INSERT ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();