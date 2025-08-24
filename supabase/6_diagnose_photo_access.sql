-- DIAGNOSE PHOTO ACCESS ISSUES

-- 1. Check if any RLS policies are blocking access
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%user photos%'
ORDER BY policyname;

-- 2. Check the exact bucket configuration
SELECT 
  id,
  name,
  owner,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-photos';

-- 3. Check if there are any bucket-level restrictions
SELECT *
FROM storage.buckets
WHERE id = 'user-photos';

-- 4. Test with a specific file
SELECT 
  bucket_id,
  name,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Check if storage schema has proper permissions
SELECT 
  nspname,
  has_schema_privilege('anon', nspname, 'USAGE') as anon_can_use,
  has_schema_privilege('authenticated', nspname, 'USAGE') as auth_can_use
FROM pg_namespace
WHERE nspname = 'storage';