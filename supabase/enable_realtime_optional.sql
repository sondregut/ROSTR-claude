-- OPTIONAL: Enable realtime for social features
-- Only run this if you want live updates for likes/comments

-- Enable realtime for date entries (live feed updates)
ALTER TABLE date_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_entries;

-- Enable realtime for date likes (see likes instantly)
ALTER TABLE date_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_likes;

-- Enable realtime for date comments (live comments)
ALTER TABLE date_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_comments;