-- TEST IF PHOTOS ARE ACCESSIBLE
-- Copy one of these URLs and paste in your browser to test

-- Get your Supabase project URL from environment
-- Replace YOUR_PROJECT_ID with your actual Supabase project ID
-- You can find it in your Supabase dashboard URL: https://YOUR_PROJECT_ID.supabase.co

SELECT 
  name,
  created_at,
  '👉 Test this URL in browser:' as instruction,
  'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/user-photos/' || name as photo_url
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 5;

-- Alternative: Get just the path to construct URL manually
SELECT 
  name as file_path,
  created_at
FROM storage.objects
WHERE bucket_id = 'user-photos'
ORDER BY created_at DESC
LIMIT 5;