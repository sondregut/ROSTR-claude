-- Safe script to enable real-time for feed tables
-- Checks if tables are already in publication before adding

-- Function to safely add table to publication
CREATE OR REPLACE FUNCTION add_table_to_realtime(table_name text)
RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) THEN
        RAISE NOTICE 'Table % does not exist, skipping', $1;
        RETURN;
    END IF;
    
    -- Check if already in publication
    IF EXISTS (
        SELECT FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = $1
    ) THEN
        RAISE NOTICE 'Table % already has real-time enabled', $1;
        RETURN;
    END IF;
    
    -- Set replica identity
    EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', $1);
    
    -- Add to publication
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', $1);
    
    RAISE NOTICE 'Successfully enabled real-time for table %', $1;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for all feed tables
SELECT add_table_to_realtime('date_entries');
SELECT add_table_to_realtime('date_likes');
SELECT add_table_to_realtime('date_comments');
SELECT add_table_to_realtime('date_plans');
SELECT add_table_to_realtime('plan_likes');
SELECT add_table_to_realtime('plan_comments');
SELECT add_table_to_realtime('poll_votes');
SELECT add_table_to_realtime('date_reactions');
SELECT add_table_to_realtime('plan_reactions');

-- Clean up the temporary function
DROP FUNCTION add_table_to_realtime(text);

-- Show final status of all feed tables
SELECT 
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ Enabled'
    ELSE '❌ Not enabled'
  END as realtime_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND tablename IN (
    'date_entries', 
    'date_likes', 
    'date_comments',
    'date_plans',
    'plan_likes',
    'plan_comments',
    'poll_votes',
    'date_reactions',
    'plan_reactions'
  )
ORDER BY tablename;