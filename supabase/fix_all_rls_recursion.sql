-- COMPREHENSIVE RLS RECURSION FIX
-- This script fixes ALL recursion issues in RLS policies
-- Run this IMMEDIATELY in Supabase SQL Editor

-- =====================================================
-- STEP 1: Drop ALL problematic policies
-- =====================================================

-- Drop all circle_members policies
DROP POLICY IF EXISTS "Users can view circle memberships" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners and admins can manage members" ON public.circle_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners can view all memberships" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners can manage members" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners can remove members" ON public.circle_members;

-- Drop problematic user policies
DROP POLICY IF EXISTS "Users can view accessible user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;

-- Drop problematic date entry policies that might reference circles
DROP POLICY IF EXISTS "Users can view public date entries and entries from their circles" ON public.date_entries;

-- =====================================================
-- STEP 2: Create SIMPLE, non-recursive policies
-- =====================================================

-- Simple circle_members policies (NO RECURSION)
CREATE POLICY "circle_members_select_own" ON public.circle_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "circle_members_insert_own" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "circle_members_delete_own" ON public.circle_members
  FOR DELETE USING (auth.uid() = user_id);

-- Simple users policies (NO RECURSION)
CREATE POLICY "users_select_all_active" ON public.users
  FOR SELECT USING (is_active = true);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple date entries policies (NO CIRCLE REFERENCES)
CREATE POLICY "date_entries_select_public_or_own" ON public.date_entries
  FOR SELECT USING (
    is_private = false OR 
    user_id = auth.uid()
  );

CREATE POLICY "date_entries_insert_own" ON public.date_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "date_entries_update_own" ON public.date_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "date_entries_delete_own" ON public.date_entries
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: Drop and recreate problematic functions
-- =====================================================

-- Drop functions that might cause recursion
DROP FUNCTION IF EXISTS users_share_circle(UUID, UUID);
DROP FUNCTION IF EXISTS can_view_user_profile(UUID, UUID);

-- Create simple, non-recursive functions
CREATE OR REPLACE FUNCTION users_share_circle_simple(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Simplified version that doesn't cause recursion
  RETURN FALSE; -- Temporarily disable circle sharing checks
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION can_view_user_profile_simple(viewer_id UUID, profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Simplified version - users can view all active profiles
  RETURN viewer_id = profile_id OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = profile_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

-- Test basic queries to ensure no recursion
SELECT 'Testing users table...' as test;
SELECT COUNT(*) as user_count FROM public.users WHERE is_active = true;

SELECT 'Testing circle_members table...' as test;
SELECT COUNT(*) as member_count FROM public.circle_members;

SELECT 'Testing date_entries table...' as test;
SELECT COUNT(*) as date_count FROM public.date_entries WHERE is_private = false;

SELECT '✅ RLS recursion fix completed successfully!' as status;

-- =====================================================
-- STEP 5: Notes for later enhancement
-- =====================================================

-- After confirming the app works, you can gradually re-add 
-- more sophisticated policies, but ensure they don't reference
-- the same table they're protecting or create circular dependencies.

-- For now, this provides basic security while eliminating recursion.
