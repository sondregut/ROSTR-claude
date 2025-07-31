-- Diagnose what's not ready

-- 1. Check RLS count
SELECT 'RLS Check:' as check_type;
SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as with_rls,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as without_rls
FROM pg_tables WHERE schemaname = 'public';

-- 2. Check specific realtime tables
SELECT 'Realtime Check:' as check_type;
SELECT 
    'date_entries' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'date_entries'
    ) THEN '✅ Enabled' ELSE '❌ Not enabled' END as status
UNION ALL
SELECT 
    'circle_chat_messages' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'circle_chat_messages'
    ) THEN '✅ Enabled' ELSE '❌ Not enabled' END as status
UNION ALL
SELECT 
    'date_comments' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'date_comments'
    ) THEN '✅ Enabled' ELSE '❌ Not enabled' END as status
UNION ALL
SELECT 
    'date_likes' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'date_likes'
    ) THEN '✅ Enabled' ELSE '❌ Not enabled' END as status;

-- 3. Check storage buckets
SELECT 'Storage Check:' as check_type;
SELECT name, public 
FROM storage.buckets 
WHERE name IN ('user-photos', 'date-photos', 'chat-media')
ORDER BY name;

-- 4. Show what's missing
SELECT 'What needs fixing:' as check_type;
WITH status_check AS (
    SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_count,
        (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'date_entries') as feed_rt,
        (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'circle_chat_messages') as chat_rt,
        (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('user-photos', 'date-photos', 'chat-media')) as storage_count
)
SELECT 
    CASE WHEN rls_count < 31 THEN '❌ Need to enable RLS on ' || (31 - rls_count) || ' more tables' ELSE '✅ RLS is good' END as rls_status,
    CASE WHEN feed_rt = 0 THEN '❌ Need to enable realtime on date_entries' ELSE '✅ Feed realtime is good' END as feed_status,
    CASE WHEN chat_rt = 0 THEN '❌ Need to enable realtime on circle_chat_messages' ELSE '✅ Chat realtime is good' END as chat_status,
    CASE WHEN storage_count < 3 THEN '❌ Missing ' || (3 - storage_count) || ' storage buckets' ELSE '✅ Storage is good' END as storage_status
FROM status_check;