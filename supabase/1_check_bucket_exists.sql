-- CHECK IF STORAGE BUCKETS EXIST
-- Run this in Supabase SQL Editor

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