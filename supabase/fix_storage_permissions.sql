-- Fix Storage Bucket Permissions
-- Run this to ensure storage buckets are accessible

-- First, check if buckets exist
SELECT id, name, public FROM storage.buckets;

-- Make sure buckets are public (for profile photos and date images)
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('user-photos', 'date-entry-images');

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view date images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload date images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their date images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their date images" ON storage.objects;

-- Create policies for user-photos bucket
CREATE POLICY "Anyone can view user photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for date-entry-images bucket
CREATE POLICY "Anyone can view date images"
ON storage.objects FOR SELECT
USING (bucket_id = 'date-entry-images');

CREATE POLICY "Users can upload date images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'date-entry-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their date images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'date-entry-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their date images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'date-entry-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for chat-media bucket (private)
DROP POLICY IF EXISTS "Users can view chat media in their circles" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;

CREATE POLICY "Users can view chat media in their circles"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;