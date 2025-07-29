-- Drop all existing storage policies
-- Run this BEFORE storage_setup.sql if you get "policy already exists" errors

-- Drop user-photos policies
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Drop date-entry-images policies
DROP POLICY IF EXISTS "Users can upload date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own date entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own date entry images" ON storage.objects;

-- Drop chat-media policies
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat media in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;

-- Also drop any other storage policies that might exist
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to user photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;