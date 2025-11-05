-- Fix nullable user_id columns that bypass RLS policies
ALTER TABLE public.activities 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_books 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_books 
ALTER COLUMN book_id SET NOT NULL;

ALTER TABLE public.user_follows 
ALTER COLUMN follower_id SET NOT NULL;

ALTER TABLE public.user_follows 
ALTER COLUMN following_id SET NOT NULL;

-- Add constraint to prevent self-follows
ALTER TABLE public.user_follows 
ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);

-- Create avatars storage bucket with proper security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Fix database functions security - add search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'full_name'
    );
    RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;