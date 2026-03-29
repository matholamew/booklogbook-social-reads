-- Drop the overly permissive policy that exposes all user_books to everyone
DROP POLICY IF EXISTS "Users can view others books" ON user_books;

-- Replace with follower-restricted policy (consistent with activities table)
CREATE POLICY "Users can view own or followed users books"
  ON user_books FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid() AND following_id = user_books.user_id
    )
  );