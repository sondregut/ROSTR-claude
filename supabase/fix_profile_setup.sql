-- Fix profile setup issues for phone authentication
-- Run this in your Supabase SQL Editor

-- 1. Make email nullable for phone auth users
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. Add constraint to ensure either email or phone exists
ALTER TABLE public.users ADD CONSTRAINT users_email_or_phone_check 
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- 3. Check current state of the gender column
-- If this query returns data, gender column already exists
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'gender';

-- 4. Verify the user_gender enum type exists
SELECT typname FROM pg_type WHERE typname = 'user_gender';

-- 5. View any existing users to debug
SELECT id, email, phone, name, username, gender, date_of_birth, age 
FROM public.users 
LIMIT 5;