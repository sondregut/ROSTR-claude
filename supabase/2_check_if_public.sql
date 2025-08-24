-- CHECK IF USER-PHOTOS BUCKET IS PUBLIC
-- This is CRITICAL - if it shows ❌ PRIVATE, photos won't display!

SELECT 
  id,
  name,
  public as is_public,
  CASE 
    WHEN public = true THEN '✅ PUBLIC - Photos will display!'
    ELSE '❌ PRIVATE - Photos WON''T display! Run 3_make_bucket_public.sql to fix!'
  END as status
FROM storage.buckets
WHERE id = 'user-photos';