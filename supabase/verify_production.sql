-- Verify Production Supabase Setup
-- Run this in your production Supabase SQL editor to check what's already configured

-- 1. Check which tables exist
SELECT 'TABLES CHECK' as check_type;
SELECT table_name, 
       CASE WHEN table_name IN (
         'users', 'circles', 'circle_members', 'date_entries', 
         'roster_entries', 'circle_chat_messages', 'polls'
       ) THEN '✅ Core table' ELSE '📋 Additional table' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check RLS status
SELECT 'RLS CHECK' as check_type;
SELECT schemaname, tablename, rowsecurity,
       CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check realtime status
SELECT 'REALTIME CHECK' as check_type;
SELECT pt.schemaname, pt.tablename,
       '✅ Realtime Enabled' as status
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
UNION
SELECT 'public' as schemaname, t.table_name as tablename,
       '❌ Realtime NOT Enabled' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('date_entries', 'circle_chat_messages', 'date_comments', 'date_likes', 'poll_votes')
  AND t.table_name NOT IN (
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
  )
ORDER BY tablename;

-- 4. Check storage buckets
SELECT 'STORAGE CHECK' as check_type;
SELECT name, public,
       CASE WHEN name IN ('user-photos', 'date-photos', 'chat-media') 
            THEN '✅ Required bucket' 
            ELSE '📋 Additional bucket' END as status
FROM storage.buckets
ORDER BY name;

-- 5. Check missing core tables
SELECT 'MISSING TABLES CHECK' as check_type;
WITH required_tables AS (
  SELECT unnest(ARRAY[
    'users', 'circles', 'circle_members', 'circle_chat_messages',
    'date_entries', 'date_comments', 'date_likes', 'date_plans',
    'roster_entries', 'polls', 'poll_options', 'poll_votes'
  ]) AS table_name
)
SELECT rt.table_name, '❌ MISSING - Need to create' as status
FROM required_tables rt
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables t 
  WHERE t.table_schema = 'public' AND t.table_name = rt.table_name
)
ORDER BY rt.table_name;

-- 6. Check authentication providers
SELECT 'AUTH CHECK' as check_type;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN '✅ Auth configured (has users)'
    ELSE '⚠️ Auth configured (no users yet)'
  END as auth_status;

-- Summary
SELECT '🎯 SUMMARY' as check_type;
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') as realtime_tables,
  (SELECT COUNT(*) FROM storage.buckets) as storage_buckets;