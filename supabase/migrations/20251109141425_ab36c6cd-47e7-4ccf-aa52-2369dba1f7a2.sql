-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Add created_by columns to books and authors for ownership tracking
ALTER TABLE public.books ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.authors ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update existing INSERT policies to track ownership
DROP POLICY IF EXISTS "Authenticated users can insert books" ON public.books;
CREATE POLICY "Authenticated users can insert books"
  ON public.books
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Authenticated users can insert authors" ON public.authors;
CREATE POLICY "Authenticated users can insert authors"
  ON public.authors
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid()
  );

-- Add policies for users to update their own entries
CREATE POLICY "Users can update their own books"
  ON public.books
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can update their own authors"
  ON public.authors
  FOR UPDATE
  USING (created_by = auth.uid());

-- Add admin/moderator policies for content moderation
CREATE POLICY "Admins can update any book"
  ON public.books
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can update any book"
  ON public.books
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete any book"
  ON public.books
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any author"
  ON public.authors
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can update any author"
  ON public.authors
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete any author"
  ON public.authors
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));