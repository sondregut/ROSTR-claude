-- TEST YOUR ACTUAL PHOTO URLS
-- Copy any of these URLs and paste in your browser
-- They should display the images since bucket is PUBLIC

SELECT 
  name,
  created_at,
  'https://iiyoasqgwpbuijuagfmz.supabase.co/storage/v1/object/public/user-photos/' || name as photo_url
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 10;

-- Test the most recent photo
SELECT 
  '👉 TEST THIS URL IN YOUR BROWSER:' as action,
  'https://iiyoasqgwpbuijuagfmz.supabase.co/storage/v1/object/public/user-photos/' || name as latest_photo_url
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 1;