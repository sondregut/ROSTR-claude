-- Final fixes - Enable RLS on remaining tables and create missing storage bucket

-- 1. Find which 3 tables need RLS
SELECT 'Tables WITHOUT RLS:' as status;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. Enable RLS on ALL remaining tables
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
        RAISE NOTICE '✅ Enabled RLS on: %', tbl.tablename;
    END LOOP;
END $$;

-- 3. Check which storage bucket is missing
SELECT 'Missing storage bucket:' as status;
SELECT bucket_name
FROM (VALUES ('user-photos'), ('date-photos'), ('chat-media')) AS required(bucket_name)
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = required.bucket_name
);

-- 4. Create missing storage bucket
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'user-photos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);
        RAISE NOTICE '✅ Created user-photos bucket';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'date-photos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('date-photos', 'date-photos', true);
        RAISE NOTICE '✅ Created date-photos bucket';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'chat-media') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
        RAISE NOTICE '✅ Created chat-media bucket';
    END IF;
END $$;

-- 5. Final verification
SELECT '🎯 FINAL CHECK:' as status;
SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) || '/31 tables with RLS' as rls_status,
    (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('user-photos', 'date-photos', 'chat-media')) || '/3 storage buckets' as storage_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) = 31
        AND (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('user-photos', 'date-photos', 'chat-media')) = 3
        THEN '✅ PRODUCTION IS READY! 🚀'
        ELSE '❌ Something still missing'
    END as final_status;