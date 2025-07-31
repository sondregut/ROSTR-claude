-- Migration Script for Existing Production Supabase
-- This script checks what exists and only adds what's missing

-- 1. Enable RLS on all tables (safe to run multiple times)
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
        RAISE NOTICE 'Enabled RLS on table: %', tbl.tablename;
    END LOOP;
END $$;

-- 2. Safe function to enable realtime
CREATE OR REPLACE FUNCTION enable_realtime_if_needed(target_table text)
RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = target_table
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping', target_table;
        RETURN;
    END IF;
    
    -- Check if already in publication
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = target_table
    ) THEN
        RAISE NOTICE 'Table % already has real-time enabled', target_table;
        RETURN;
    END IF;
    
    -- Enable realtime
    EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', target_table);
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', target_table);
    RAISE NOTICE 'Enabled real-time for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- 3. Enable realtime for all needed tables
SELECT enable_realtime_if_needed('date_entries');
SELECT enable_realtime_if_needed('date_comments');
SELECT enable_realtime_if_needed('date_likes');
SELECT enable_realtime_if_needed('date_plans');
SELECT enable_realtime_if_needed('circle_chat_messages');
SELECT enable_realtime_if_needed('typing_indicators');
SELECT enable_realtime_if_needed('poll_votes');
SELECT enable_realtime_if_needed('circles');
SELECT enable_realtime_if_needed('circle_members');

-- 4. Create missing storage buckets
DO $$
BEGIN
    -- user-photos bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'user-photos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);
        RAISE NOTICE 'Created user-photos bucket';
    END IF;
    
    -- date-photos bucket  
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'date-photos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('date-photos', 'date-photos', true);
        RAISE NOTICE 'Created date-photos bucket';
    END IF;
    
    -- chat-media bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'chat-media') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
        RAISE NOTICE 'Created chat-media bucket';
    END IF;
END $$;

-- 5. Add missing columns (safe - won't error if they exist)
-- Add reactions column to date_entries if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_entries' AND column_name = 'reactions'
    ) THEN
        ALTER TABLE date_entries ADD COLUMN reactions JSONB DEFAULT '{}';
        RAISE NOTICE 'Added reactions column to date_entries';
    END IF;
END $$;

-- Add reactions to date_plans if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'date_plans' AND column_name = 'reactions'
    ) THEN
        ALTER TABLE date_plans ADD COLUMN reactions JSONB DEFAULT '{}';
        RAISE NOTICE 'Added reactions column to date_plans';
    END IF;
END $$;

-- 6. Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_date_entries_user_id ON date_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_date_entries_created_at ON date_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_circle_id ON circle_chat_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_chat_messages_created_at ON circle_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_date_comments_date_id ON date_comments(date_id);
CREATE INDEX IF NOT EXISTS idx_date_likes_date_id ON date_likes(date_id);

-- 7. Ensure RLS policies exist (check a few critical ones)
DO $$
BEGIN
    -- Check if users can read their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Created policy: Users can view own profile';
    END IF;
    
    -- Check if users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Created policy: Users can update own profile';
    END IF;
END $$;

-- Clean up
DROP FUNCTION IF EXISTS enable_realtime_if_needed(text);

-- Final check
SELECT 'Migration complete! Here is your current status:' as message;

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
WHERE pubname = 'supabase_realtime'

UNION ALL

SELECT 
    'Storage buckets' as metric,
    COUNT(*) as count
FROM storage.buckets
WHERE name IN ('user-photos', 'date-photos', 'chat-media');