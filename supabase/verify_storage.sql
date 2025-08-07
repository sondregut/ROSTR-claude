-- Verify Storage Configuration
-- Run this to check storage buckets and policies

-- 1. Check if buckets exist
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at,
    updated_at
FROM storage.buckets
WHERE id IN ('user-photos', 'date-entry-images', 'chat-media')
ORDER BY id;

-- 2. Check RLS policies on storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as operation,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 3. Check if RLS is enabled on storage tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename IN ('objects', 'buckets');

-- 4. Test if current user can access buckets
-- This will show what the current authenticated user can see
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user - run this while authenticated';
    ELSE
        RAISE NOTICE 'Current user ID: %', current_user_id;
    END IF;
END $$;