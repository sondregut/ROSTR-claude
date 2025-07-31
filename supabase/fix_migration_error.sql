-- Fix Migration Error - Check actual column names

-- 1. Check date_comments table structure
SELECT 'date_comments table structure:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'date_comments'
ORDER BY ordinal_position;

-- 2. Check date_likes table structure
SELECT 'date_likes table structure:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'date_likes'
ORDER BY ordinal_position;

-- 3. Create indexes with correct column names
DO $$
BEGIN
    -- For date_comments - check if it uses entry_id instead of date_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_comments' AND column_name = 'entry_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_date_comments_entry_id ON date_comments(entry_id);
        RAISE NOTICE 'Created index on date_comments.entry_id';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_comments' AND column_name = 'date_entry_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_date_comments_date_entry_id ON date_comments(date_entry_id);
        RAISE NOTICE 'Created index on date_comments.date_entry_id';
    END IF;

    -- For date_likes - check column name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_likes' AND column_name = 'entry_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_date_likes_entry_id ON date_likes(entry_id);
        RAISE NOTICE 'Created index on date_likes.entry_id';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_likes' AND column_name = 'date_entry_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_date_likes_date_entry_id ON date_likes(date_entry_id);
        RAISE NOTICE 'Created index on date_likes.date_entry_id';
    END IF;
END $$;

-- 4. Continue with other safe indexes
CREATE INDEX IF NOT EXISTS idx_date_entries_user_id ON date_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_date_entries_created_at ON date_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_circle_id ON circle_chat_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_created_at ON circle_chat_messages(created_at DESC);

-- 5. Show all existing indexes
SELECT 'Existing indexes:' as check;
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('date_entries', 'date_comments', 'date_likes', 'circle_chat_messages')
ORDER BY tablename, indexname;

-- 6. Final summary
SELECT 'Migration status:' as check;
SELECT 
    'Tables with RLS' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
    'Realtime-enabled tables' as metric,
    COUNT(*) as count
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';