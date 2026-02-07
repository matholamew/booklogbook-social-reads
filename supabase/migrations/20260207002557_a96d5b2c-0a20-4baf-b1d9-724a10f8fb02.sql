-- Fix: Restrict user_follows visibility to prevent complete social graph exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all follows" ON public.user_follows;

-- Create a more restrictive policy that only allows users to see:
-- 1. Their own follows (who they follow)
-- 2. Who follows them
-- 3. Follows of people they follow (for social discovery)
CREATE POLICY "Users can view relevant follows"
  ON public.user_follows
  FOR SELECT
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id OR
    EXISTS (
      SELECT 1 FROM user_follows uf
      WHERE uf.follower_id = auth.uid() 
      AND uf.following_id = user_follows.follower_id
    )
  );