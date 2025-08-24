-- MAKE USER-PHOTOS BUCKET PUBLIC
-- Only run this if 2_check_if_public.sql shows ❌ PRIVATE

UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-photos';

-- Verify it worked
SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public = true THEN '✅ SUCCESS - Bucket is now PUBLIC!'
    ELSE '❌ FAILED - Still private, contact support'
  END as status
FROM storage.buckets
WHERE id = 'user-photos';