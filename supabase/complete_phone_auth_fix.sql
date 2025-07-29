-- Complete Phone Authentication Fix for Supabase
-- Run this in your Supabase SQL Editor to fix all phone auth issues
-- Last updated: 2025-01-29

-- =====================================================
-- STEP 1: Fix Database Schema for Phone Auth
-- =====================================================

-- Make email nullable for phone auth users
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or phone exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_or_phone_check'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_or_phone_check 
        CHECK (email IS NOT NULL OR phone IS NOT NULL);
    END IF;
END $$;

-- =====================================================
-- STEP 2: Fix Trigger Conflicts
-- =====================================================

-- Drop the old trigger and function that might conflict with phone auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create an updated trigger function that properly handles phone auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists (to prevent duplicates)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Insert with proper null handling for email and phone
  INSERT INTO public.users (
    id, 
    email, 
    phone,
    name, 
    username,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, -- Can be null for phone auth
    NEW.phone, -- Can be null for email auth
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name',
      ''  -- Empty string instead of 'User' for phone auth flow
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;  -- Prevent errors if user already exists
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN others THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger with proper error handling
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =====================================================
-- STEP 3: Ensure Phone Column Exists
-- =====================================================

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone text;
        CREATE INDEX idx_users_phone ON public.users(phone);
    END IF;
END $$;

-- =====================================================
-- STEP 4: Update RLS Policies for Phone Auth
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new policies that work with phone auth
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 5: Create Helper Function for Phone Auth Flow
-- =====================================================

-- Function to update user profile after phone verification
CREATE OR REPLACE FUNCTION update_user_after_phone_verification(
  user_id uuid,
  user_name text,
  user_username text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET 
    name = COALESCE(user_name, name),
    username = COALESCE(user_username, username, 'user_' || substr(user_id::text, 1, 8)),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_after_phone_verification TO authenticated;

-- =====================================================
-- STEP 6: Verify Setup
-- =====================================================

-- Check if everything is set up correctly
DO $$
DECLARE
    result text := '';
BEGIN
    -- Check users table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        result := result || '✅ Phone column exists' || E'\n';
    ELSE
        result := result || '❌ Phone column missing' || E'\n';
    END IF;
    
    -- Check constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_or_phone_check') THEN
        result := result || '✅ Email/Phone constraint exists' || E'\n';
    ELSE
        result := result || '❌ Email/Phone constraint missing' || E'\n';
    END IF;
    
    -- Check trigger
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        result := result || '✅ User creation trigger exists' || E'\n';
    ELSE
        result := result || '❌ User creation trigger missing' || E'\n';
    END IF;
    
    RAISE NOTICE '%', result;
END $$;

-- =====================================================
-- STEP 7: Clean Up Any Test Data (Optional)
-- =====================================================

-- Uncomment to delete test phone auth users without profiles
-- DELETE FROM auth.users 
-- WHERE phone IS NOT NULL 
-- AND email IS NULL 
-- AND created_at < NOW() - INTERVAL '1 day'
-- AND id NOT IN (SELECT id FROM public.users WHERE gender IS NOT NULL);

-- View current users to verify
SELECT 
    u.id,
    u.email,
    u.phone,
    u.name,
    u.username,
    u.created_at,
    CASE 
        WHEN u.email IS NOT NULL THEN 'Email Auth'
        WHEN u.phone IS NOT NULL THEN 'Phone Auth'
        ELSE 'Unknown'
    END as auth_type
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 10;