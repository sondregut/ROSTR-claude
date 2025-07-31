-- Enable RLS on remaining 3 tables and final verification

-- 1. Find and fix tables without RLS
SELECT 'Enabling RLS on remaining tables...' as status;

DO $$
DECLARE
    tbl RECORD;
    count_fixed INTEGER := 0;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on: %', tbl.tablename;
        count_fixed := count_fixed + 1;
    END LOOP;
    
    RAISE NOTICE 'Fixed % tables', count_fixed;
END $$;

-- 2. Verify all tables now have RLS
SELECT 'RLS Status After Fix:' as check;
SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as tables_with_rls,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as tables_without_rls
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. List any remaining tables without RLS (should be none)
SELECT 'Tables still without RLS (if any):' as check;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- 4. Verify critical features are ready
SELECT '✅ Production Ready Check:' as status;

WITH checks AS (
    SELECT 
        (SELECT COUNT(*) = 31 FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as all_rls_enabled,
        EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'date_entries') as feed_realtime,
        EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'circle_chat_messages') as chat_realtime,
        EXISTS (SELECT 1 FROM storage.buckets WHERE name IN ('user-photos', 'date-photos', 'chat-media')) as storage_ready
)
SELECT 
    CASE WHEN all_rls_enabled THEN '✅' ELSE '❌' END || ' All tables have RLS' as check_item,
    CASE WHEN feed_realtime THEN '✅' ELSE '❌' END || ' Feed real-time enabled' as feed_status,
    CASE WHEN chat_realtime THEN '✅' ELSE '❌' END || ' Chat real-time enabled' as chat_status,
    CASE WHEN storage_ready THEN '✅' ELSE '❌' END || ' Storage buckets ready' as storage_status
FROM checks;

-- 5. Final summary
SELECT '🚀 DEPLOYMENT STATUS:' as status;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) = 31
        AND EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'date_entries')
        AND EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'circle_chat_messages')
        THEN '✅ YOUR PRODUCTION SUPABASE IS READY! 🎉'
        ELSE '⚠️  Almost ready - check items above'
    END as final_status;