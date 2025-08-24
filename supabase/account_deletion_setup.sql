-- Account Deletion Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create a function to delete user account and all associated data
-- This runs with SECURITY DEFINER to have admin privileges
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's comments
  DELETE FROM public.comments WHERE user_id = user_id;
  
  -- Delete user's likes
  DELETE FROM public.likes WHERE user_id = user_id;
  
  -- Delete user's date entries
  DELETE FROM public.date_entries WHERE user_id = user_id;
  
  -- Delete user's date plans
  DELETE FROM public.date_plans WHERE user_id = user_id;
  
  -- Delete user's roster entries
  DELETE FROM public.roster WHERE user_id = user_id;
  
  -- Delete user's circle memberships
  DELETE FROM public.circle_members WHERE user_id = user_id;
  
  -- Delete circles owned by user
  DELETE FROM public.circles WHERE created_by = user_id;
  
  -- Delete user's photos
  DELETE FROM public.user_photos WHERE user_id = user_id;
  
  -- Delete user's notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = user_id;
  
  -- Delete user profile
  DELETE FROM public.users WHERE id = user_id;
  
  -- Delete auth user (requires admin privileges)
  -- Note: This uses the auth schema which requires SECURITY DEFINER
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;

-- 3. Add RLS policy to ensure users can only delete their own account
CREATE POLICY "Users can delete own account" 
ON public.users 
FOR DELETE 
USING (auth.uid() = id);

-- 4. Create the demo user account (optional - for App Store review)
-- First, create the auth user via Supabase Dashboard or use this helper
DO $$
BEGIN
  -- Check if demo user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'demo@rostrdating.com'
  ) THEN
    -- Note: You'll need to create this user via Supabase Auth Dashboard
    -- Go to Authentication > Users > Invite User
    -- Email: demo@rostrdating.com
    -- Password: DemoUser2024!
    RAISE NOTICE 'Please create demo user via Supabase Dashboard';
  END IF;
END $$;

-- 5. Once demo auth user is created, insert demo profile data
-- Run this after creating the auth user
INSERT INTO public.users (
  id,
  email,
  name,
  username,
  bio,
  location,
  occupation,
  age,
  interests,
  image_uri,
  total_dates,
  active_connections,
  avg_rating,
  created_at,
  updated_at
) 
SELECT 
  id,
  'demo@rostrdating.com',
  'Alex Demo',
  'alexdemo',
  'Dating enthusiast exploring the Bay Area scene',
  'San Francisco, CA',
  'Product Manager',
  29,
  ARRAY['Technology', 'Coffee', 'Hiking', 'Wine Tasting'],
  'https://i.pravatar.cc/400?img=10',
  15,
  3,
  4.3,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'demo@rostrdating.com'
ON CONFLICT (id) DO NOTHING;

-- 6. Add sample roster entries for demo user
INSERT INTO public.roster (
  user_id,
  person_name,
  person_age,
  person_occupation,
  person_location,
  person_bio,
  person_interests,
  person_instagram,
  person_image_url,
  date_count,
  last_date,
  avg_rating,
  status,
  tags,
  notes,
  created_at
)
SELECT 
  id,
  'Emma Wilson',
  28,
  'Product Designer',
  'San Francisco, CA',
  'Creative designer who loves hiking and coffee',
  ARRAY['Design', 'Hiking', 'Photography', 'Coffee'],
  '@emmawilson',
  'https://i.pravatar.cc/400?img=1',
  3,
  NOW() - INTERVAL '7 days',
  4.5,
  'active',
  ARRAY['Creative', 'Adventurous', 'Coffee Lover'],
  'Met at a design conference. Great conversation about UX trends.',
  NOW()
FROM auth.users 
WHERE email = 'demo@rostrdating.com'
ON CONFLICT DO NOTHING;

-- Add more roster entries (abbreviated for space)
-- You can add the full demo data from services/demoData.ts

-- 7. Add sample date entries for demo user
INSERT INTO public.date_entries (
  user_id,
  person_name,
  person_id,
  date,
  location,
  rating,
  tags,
  notes,
  is_second_date,
  created_at
)
SELECT 
  u.id,
  'Sarah Johnson',
  r.id,
  NOW() - INTERVAL '3 days',
  'Blue Bottle Coffee',
  5,
  ARRAY['Coffee Date', 'Great Conversation', 'Chemistry'],
  'Perfect afternoon coffee date. Talked for hours about travel plans.',
  false,
  NOW()
FROM auth.users u
JOIN public.roster r ON r.user_id = u.id AND r.person_name = 'Sarah Johnson'
WHERE u.email = 'demo@rostrdating.com'
ON CONFLICT DO NOTHING;

-- 8. Create or join demo circles
INSERT INTO public.circles (
  name,
  description,
  created_by,
  member_count,
  created_at
)
SELECT 
  'Bay Area Singles',
  'Active dating community in the Bay Area',
  id,
  12,
  NOW()
FROM auth.users 
WHERE email = 'demo@rostrdating.com'
ON CONFLICT DO NOTHING;

-- Add demo user to circle
INSERT INTO public.circle_members (
  circle_id,
  user_id,
  role,
  joined_at
)
SELECT 
  c.id,
  u.id,
  'admin',
  NOW()
FROM public.circles c
JOIN auth.users u ON u.email = 'demo@rostrdating.com'
WHERE c.name = 'Bay Area Singles'
ON CONFLICT DO NOTHING;

-- 9. Verify the setup
SELECT 
  'Demo user exists' as check_item,
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'demo@rostrdating.com') as status
UNION ALL
SELECT 
  'Demo profile exists',
  EXISTS(SELECT 1 FROM public.users WHERE email = 'demo@rostrdating.com')
UNION ALL
SELECT 
  'Delete function exists',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'delete_user_account')
UNION ALL
SELECT 
  'Demo has roster entries',
  EXISTS(SELECT 1 FROM public.roster r JOIN public.users u ON u.id = r.user_id WHERE u.email = 'demo@rostrdating.com');