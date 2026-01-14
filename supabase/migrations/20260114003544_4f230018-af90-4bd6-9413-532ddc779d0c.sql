-- Add rating column to user_books (1-5 stars, nullable)
ALTER TABLE public.user_books
ADD COLUMN IF NOT EXISTS rating integer;

-- Add constraint for valid rating values
ALTER TABLE public.user_books
ADD CONSTRAINT rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Create book_notes table for notes and highlights
CREATE TABLE public.book_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_book_id uuid NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    highlight_text text,
    tags text[] DEFAULT '{}',
    page_number integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster tag searches
CREATE INDEX idx_book_notes_tags ON public.book_notes USING GIN(tags);
CREATE INDEX idx_book_notes_user_id ON public.book_notes(user_id);
CREATE INDEX idx_book_notes_user_book_id ON public.book_notes(user_book_id);

-- Enable RLS
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_notes
CREATE POLICY "Users can view their own notes"
ON public.book_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON public.book_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.book_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.book_notes FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_book_notes_updated_at
BEFORE UPDATE ON public.book_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();