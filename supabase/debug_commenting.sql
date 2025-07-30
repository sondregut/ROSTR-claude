-- Debug Commenting Functionality
-- Run this script to verify commenting setup and identify issues

-- 1. CHECK IF COMMENT TABLES EXIST
SELECT 'COMMENT TABLES CHECK' as check_type;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('date_comments', 'date_likes')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. CHECK IF COMMENT COUNT COLUMNS EXIST ON DATE_ENTRIES
SELECT 'DATE_ENTRIES COLUMNS CHECK' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'date_entries' 
AND column_name IN ('comment_count', 'like_count')
AND table_schema = 'public';

-- 3. CHECK COMMENT FUNCTIONS EXIST
SELECT 'COMMENT FUNCTIONS CHECK' as check_type;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'increment_date_comment_count',
  'decrement_date_comment_count',
  'increment_date_like_count',
  'decrement_date_like_count'
)
AND routine_schema = 'public';

-- 4. CHECK RLS POLICIES FOR COMMENTS
SELECT 'COMMENT RLS POLICIES CHECK' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('date_comments', 'date_likes')
ORDER BY tablename, policyname;

-- 5. CHECK IF SAMPLE DATE ENTRIES EXIST
SELECT 'SAMPLE DATA CHECK' as check_type;
SELECT COUNT(*) as total_dates, 
       COUNT(CASE WHEN comment_count > 0 THEN 1 END) as dates_with_comments,
       COUNT(CASE WHEN like_count > 0 THEN 1 END) as dates_with_likes
FROM date_entries;

-- 6. TEST COMMENT INSERTION (Replace USER_ID and DATE_ID with actual values)
-- This will help identify if the issue is with permissions or data insertion
-- SELECT 'COMMENT INSERTION TEST' as check_type;
-- INSERT INTO date_comments (date_entry_id, user_id, content) 
-- VALUES ('YOUR_DATE_ID', 'YOUR_USER_ID', 'Test comment from debug script');

-- 7. CHECK CURRENT USER AUTHENTICATION
SELECT 'CURRENT USER CHECK' as check_type;
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 8. CHECK EXISTING COMMENTS
SELECT 'EXISTING COMMENTS CHECK' as check_type;
SELECT dc.id, dc.date_entry_id, dc.user_id, dc.content, dc.created_at,
       de.person_name, de.user_id as date_author_id
FROM date_comments dc
JOIN date_entries de ON dc.date_entry_id = de.id
ORDER BY dc.created_at DESC
LIMIT 10;