-- Enable Realtime for feed-related tables
-- This allows real-time updates for the social feed

-- Enable realtime for date entries (main feed content)
ALTER TABLE date_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_entries;

-- Enable realtime for date likes
ALTER TABLE date_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_likes;

-- Enable realtime for date comments
ALTER TABLE date_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_comments;

-- Enable realtime for date plans
ALTER TABLE date_plans REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_plans;

-- Enable realtime for plan likes
ALTER TABLE plan_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_likes;

-- Enable realtime for plan comments
ALTER TABLE plan_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_comments;

-- Enable realtime for poll votes
ALTER TABLE poll_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;

-- Enable realtime for reactions (if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'date_reactions') THEN
        ALTER TABLE date_reactions REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE date_reactions;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_reactions') THEN
        ALTER TABLE plan_reactions REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE plan_reactions;
    END IF;
END $$;

-- Verify realtime is enabled for all feed tables
SELECT 
  schemaname,
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime'
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