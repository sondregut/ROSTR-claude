-- FORCE PUBLIC ACCESS TO USER PHOTOS
-- This is a more aggressive approach to ensure photos are accessible

-- 1. Drop ALL existing policies for user-photos
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND qual::text LIKE '%user-photos%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 2. Create a single, simple public access policy
CREATE POLICY "public_photos_access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- 3. Ensure bucket is public with no restrictions
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = null,  -- Remove size limit for testing
  allowed_mime_types = null -- Remove mime type restrictions for testing
WHERE id = 'user-photos';

-- 4. Grant explicit permissions
GRANT ALL ON storage.objects TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO postgres, anon, authenticated, service_role;

-- 5. Verify setup
SELECT 
  'Policies for user-photos:' as info,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND qual::text LIKE '%user-photos%'

UNION ALL

SELECT 
  'Bucket public status:' as info,
  CASE WHEN public THEN 1 ELSE 0 END as policy_count
FROM storage.buckets
WHERE id = 'user-photos';

-- 6. Get a test URL
SELECT 
  'TEST THIS URL:' as instruction,
  'https://iiyoasqgwpbuijuagfmz.supabase.co/storage/v1/object/public/user-photos/' || name as url
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 1;