-- Restore followed-user visibility on activities table (social feed)
-- This is safe because activities only contain activity_type + note, not full book data
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;

CREATE POLICY "Users can view own and friends activities"
ON public.activities
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_follows
    WHERE user_follows.follower_id = auth.uid()
      AND user_follows.following_id = activities.user_id
  )
);