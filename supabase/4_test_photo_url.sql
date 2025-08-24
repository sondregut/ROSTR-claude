-- TEST IF PHOTOS ARE ACCESSIBLE
-- This will show recent photo URLs you can test in your browser

SELECT 
  'https://' || 
  (SELECT project_ref FROM auth.config LIMIT 1) || 
  '.supabase.co/storage/v1/object/public/user-photos/' || 
  name as photo_url,
  created_at
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 5;