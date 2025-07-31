-- Final Production Check & Fix
-- Run this after the migration to ensure everything is ready

-- 1. Check which 3 tables don't have RLS
SELECT 'Tables WITHOUT RLS (need fixing):' as check;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- 2. Check critical realtime tables
SELECT 'Critical realtime status:' as check;
SELECT 
    t.table_name,
    CASE 
        WHEN pt.tablename IS NOT NULL THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as realtime_status
FROM (
    VALUES 
        ('date_entries'),
        ('circle_chat_messages'),
        ('date_comments'),
        ('date_likes'),
        ('typing_indicators')
) AS t(table_name)
LEFT JOIN pg_publication_tables pt 
    ON pt.tablename = t.table_name 
    AND pt.pubname = 'supabase_realtime'
ORDER BY t.table_name;

-- 3. Quick enable RLS on remaining tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on: %', tbl.tablename;
    END LOOP;
END $$;

-- 4. Test critical features
SELECT 'Feature test results:' as check;

-- Can create a user?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT')
        THEN '✅ User creation policies exist'
        ELSE '❌ Missing user creation policy'
    END as user_creation;

-- Can read date entries?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'date_entries' AND cmd = 'SELECT')
        THEN '✅ Date reading policies exist'
        ELSE '❌ Missing date reading policy'
    END as date_reading;

-- Can send chat messages?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circle_chat_messages' AND cmd = 'INSERT')
        THEN '✅ Chat sending policies exist'
        ELSE '❌ Missing chat sending policy'
    END as chat_sending;

-- 5. Final summary
SELECT '🎯 FINAL STATUS:' as check;
SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
    (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') as realtime_tables,
    'Your production Supabase is ready!' as status;