-- Check if notification tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_preferences', 'push_tokens')
ORDER BY table_name, ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences', 'push_tokens');

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences', 'push_tokens');