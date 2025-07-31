-- Safe script to enable real-time for feed tables
-- Fixed version that avoids column name conflicts

-- Function to safely add table to publication
CREATE OR REPLACE FUNCTION add_table_to_realtime(target_table text)
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
        RAISE NOTICE 'Table % already has real-time enabled', target_table;
        RETURN;
    END IF;
    
    -- Set replica identity
    EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', target_table);
    
    -- Add to publication
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', target_table);
    
    RAISE NOTICE 'Successfully enabled real-time for table %', target_table;
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
  t.table_name as tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables pt
      WHERE pt.pubname = 'supabase_realtime'
      AND pt.tablename = t.table_name
    ) THEN '✅ Enabled'
    ELSE '❌ Not enabled'
  END as realtime_status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN (
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
ORDER BY t.table_name;