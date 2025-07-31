-- Fix real-time for circle chat messaging
-- This ensures messages appear instantly

-- Function to safely enable realtime
CREATE OR REPLACE FUNCTION enable_realtime_safe(target_table text)
RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name = target_table
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping', target_table;
        RETURN;
    END IF;
    
    -- Check if already in publication
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables pt
        WHERE pt.pubname = 'supabase_realtime' 
        AND pt.schemaname = 'public' 
        AND pt.tablename = target_table
    ) THEN
        RAISE NOTICE 'Table % already has real-time enabled, ensuring proper setup...', target_table;
        -- Even if it exists, ensure REPLICA IDENTITY is set
        EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', target_table);
        RETURN;
    END IF;
    
    -- Set replica identity
    EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', target_table);
    
    -- Add to publication
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', target_table);
    
    RAISE NOTICE 'Successfully enabled real-time for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for all chat-related tables
SELECT enable_realtime_safe('circle_chat_messages');
SELECT enable_realtime_safe('circle_chat_members');
SELECT enable_realtime_safe('circle_message_reads');
SELECT enable_realtime_safe('circles');
SELECT enable_realtime_safe('circle_members');

-- Drop temporary function
DROP FUNCTION enable_realtime_safe(text);

-- Verify real-time is properly configured
SELECT 
    t.table_name,
    CASE 
        WHEN pt.tablename IS NOT NULL THEN '✅ Enabled'
        ELSE '❌ Not enabled'
    END as realtime_status,
    CASE 
        WHEN t.table_name IN ('circle_chat_messages', 'circle_chat_members') THEN 'Required for chat'
        WHEN t.table_name = 'circle_message_reads' THEN 'For read receipts'
        WHEN t.table_name IN ('circles', 'circle_members') THEN 'For member updates'
        ELSE 'Optional'
    END as purpose
FROM information_schema.tables t
LEFT JOIN pg_publication_tables pt 
    ON pt.schemaname = 'public' 
    AND pt.tablename = t.table_name 
    AND pt.pubname = 'supabase_realtime'
WHERE t.table_schema = 'public'
    AND t.table_name IN (
        'circle_chat_messages',
        'circle_chat_members', 
        'circle_message_reads',
        'circles',
        'circle_members'
    )
ORDER BY 
    CASE t.table_name
        WHEN 'circle_chat_messages' THEN 1
        WHEN 'circle_chat_members' THEN 2
        ELSE 3
    END;

-- Check for any RLS policies that might be blocking real-time
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'circle_chat_messages'
ORDER BY policyname;

-- Ensure indexes exist for better real-time performance
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_circle_id 
    ON circle_chat_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_created_at 
    ON circle_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_sender_id 
    ON circle_chat_messages(sender_id);

-- Analyze tables for query optimization
ANALYZE circle_chat_messages;
ANALYZE circle_chat_members;