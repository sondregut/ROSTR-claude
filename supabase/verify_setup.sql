-- Verify Production Setup
-- Run each section to check your setup

-- 1. CHECK ALL TABLES EXIST
SELECT 'TABLES CHECK' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. CHECK STORAGE BUCKETS
SELECT 'STORAGE BUCKETS CHECK' as check_type;
SELECT id, name, public, file_size_limit 
FROM storage.buckets;

-- 3. CHECK RLS IS ENABLED
SELECT 'RLS CHECK' as check_type;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. CHECK REALTIME TABLES
SELECT 'REALTIME CHECK' as check_type;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 5. COUNT POLICIES PER TABLE
SELECT 'POLICIES COUNT CHECK' as check_type;
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 6. CHECK FUNCTIONS EXIST
SELECT 'FUNCTIONS CHECK' as check_type;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;