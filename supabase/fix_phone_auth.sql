-- Fix for "Database error saving new user" with phone authentication
-- Run this in your Supabase SQL Editor

-- Drop the conflicting trigger that's causing issues with phone auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well since it's no longer needed
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify the trigger is removed
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- This should return no rows if successful