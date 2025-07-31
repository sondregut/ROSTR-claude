-- Debug script to diagnose chat real-time issues

-- 1. Check which chat tables actually exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN '✅ Real-time enabled'
        ELSE '❌ Real-time NOT enabled'
    END as realtime_status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%message%' 
        OR table_name LIKE '%chat%'
        OR table_name = 'typing_indicators'
    )
ORDER BY table_name;

-- 2. Check RLS policies on chat messages
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    qual::text as policy_condition
FROM pg_policies
WHERE tablename IN ('circle_chat_messages', 'messages')
    AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 3. Check if there are any triggers that might delay inserts
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN ('circle_chat_messages', 'messages')
ORDER BY event_object_table, trigger_name;

-- 4. Check recent messages to see if created_at is being set correctly
SELECT 
    id,
    content,
    created_at,
    NOW() - created_at as age,
    sender_id,
    circle_id
FROM circle_chat_messages
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test if real-time is working by inserting a test message
-- (Comment this out if you don't want to insert test data)
/*
DO $$
DECLARE
    test_circle_id UUID;
    test_user_id UUID;
BEGIN
    -- Get a circle and user for testing
    SELECT circle_id, user_id INTO test_circle_id, test_user_id
    FROM circle_members
    LIMIT 1;
    
    IF test_circle_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        INSERT INTO circle_chat_messages (
            circle_id,
            sender_id,
            content,
            created_at
        ) VALUES (
            test_circle_id,
            test_user_id,
            'Test message for real-time: ' || NOW()::text,
            NOW()
        );
        
        RAISE NOTICE 'Test message inserted. Check if it appears in real-time.';
    ELSE
        RAISE NOTICE 'No circle or user found for testing.';
    END IF;
END $$;
*/

-- 6. Check connection pool settings that might affect real-time
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings
WHERE name IN (
    'max_connections',
    'max_wal_senders',
    'max_replication_slots',
    'wal_level'
);