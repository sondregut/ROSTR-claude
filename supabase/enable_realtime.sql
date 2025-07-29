-- Enable Realtime for specific tables
-- Supabase now uses ALTER TABLE to enable realtime

-- Enable realtime for circle chat messages
ALTER TABLE circle_chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE circle_chat_messages;

-- Enable realtime for circle chat members (for typing indicators)
ALTER TABLE circle_chat_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE circle_chat_members;

-- Optional: Enable realtime for date entries (for live feed updates)
-- ALTER TABLE date_entries REPLICA IDENTITY FULL;
-- ALTER PUBLICATION supabase_realtime ADD TABLE date_entries;

-- Verify realtime is enabled
SELECT 
  schemaname,
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime';