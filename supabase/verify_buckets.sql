-- Verify Storage Buckets Configuration
-- Run this in Supabase SQL Editor to check bucket setup

-- 1. Check if buckets exist and their settings
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('user-photos', 'date-entry-images', 'chat-media')
ORDER BY id;

-- 2. Check if user-photos bucket is public (IMPORTANT!)
SELECT 
  id,
  name,
  public as is_public,
  CASE 
    WHEN public = true THEN '✅ Public - Good!'
    ELSE '❌ Private - Needs to be PUBLIC for photos to display!'
  END as status
FROM storage.buckets
WHERE id = 'user-photos';

-- 3. Count files in each bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id IN ('user-photos', 'date-entry-images', 'chat-media')
GROUP BY bucket_id
ORDER BY bucket_id;

-- 4. Check recent uploads (last 10)
SELECT 
  bucket_id,
  name,
  created_at
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 10;

-- 5. If buckets don't exist, they need to be created in Supabase Dashboard
-- or by running: npm run setup:storage