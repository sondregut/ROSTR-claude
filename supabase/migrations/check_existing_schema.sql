-- Run this query first to check your existing database schema
-- This will help identify what tables and columns you currently have

-- Check if likes tables exist and their structure
SELECT 
    'date_likes' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'date_likes'

UNION ALL

SELECT 
    'plan_likes' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'plan_likes'

UNION ALL

SELECT 
    'date_entries' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'date_entries'
AND column_name IN ('id', 'like_count', 'comment_count')

UNION ALL

SELECT 
    'date_plans' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'date_plans'
AND column_name IN ('id', 'like_count', 'comment_count')

ORDER BY table_name, column_name;

-- Also check if reactions tables already exist
SELECT 
    table_name,
    'exists' as status
FROM information_schema.tables
WHERE table_name IN ('date_reactions', 'plan_reactions');