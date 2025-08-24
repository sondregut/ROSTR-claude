-- FIX STORAGE ACCESS ISSUES

-- 1. Grant proper permissions to storage schema
GRANT USAGE ON SCHEMA storage TO anon, authenticated;

-- 2. Grant SELECT permissions on storage tables
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon, authenticated;

-- 3. Ensure the bucket is truly public and accessible
UPDATE storage.buckets 
SET 
  public = true,
  avif_autodetection = false,
  file_size_limit = 5242880
WHERE id = 'user-photos';

-- 4. Drop and recreate the public access policy with simpler rules
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- 5. Add explicit anon access (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Anon users can view photos" ON storage.objects;

CREATE POLICY "Anon users can view photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'user-photos');

-- 6. Verify the changes
SELECT 
  'Bucket Status:' as check_type,
  public,
  CASE WHEN public THEN '✅ Public' ELSE '❌ Private' END as status
FROM storage.buckets
WHERE id = 'user-photos'

UNION ALL

SELECT 
  'Policy Count:' as check_type,
  COUNT(*)::boolean,
  COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND qual LIKE '%user-photos%';