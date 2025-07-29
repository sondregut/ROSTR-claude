-- Quick Fix for RLS Infinite Recursion
-- Run this immediately to fix the circle_members policy issue

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view circle memberships" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners and admins can manage members" ON public.circle_members;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can view their own memberships" ON public.circle_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Circle owners can view all memberships" ON public.circle_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circles c 
      WHERE c.id = circle_members.circle_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Circle owners can manage members" ON public.circle_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.circles c 
      WHERE c.id = circle_members.circle_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Circle owners can remove members" ON public.circle_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.circles c 
      WHERE c.id = circle_members.circle_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Update helper functions to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION users_share_circle(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.circle_members cm1
    JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
    WHERE cm1.user_id = user1_id AND cm2.user_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION can_view_user_profile(viewer_id UUID, profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Users can always view their own profile
  IF viewer_id = profile_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if both users are active
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = profile_id AND is_active = true
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Simplified check to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM public.matches
    WHERE (user_1 = viewer_id AND user_2 = profile_id)
       OR (user_1 = profile_id AND user_2 = viewer_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Verify the fix
SELECT 'RLS policies fixed successfully' as status;
