# Storage Setup Guide for Photo Uploads

## Prerequisites
1. Access to your Supabase project dashboard
2. SQL Editor access in Supabase

## Step 1: Create Storage Buckets

First, run the Node.js script to create buckets:

```bash
npm run setup:storage
```

Or create them manually in Supabase Dashboard:
- Navigate to Storage in your Supabase project
- Create the following buckets:
  1. **user-photos** (public: true, file size limit: 5MB)
  2. **date-entry-images** (public: true, file size limit: 10MB)
  3. **chat-media** (public: false, file size limit: 20MB)

## Step 2: Run Storage Permissions SQL

Go to the SQL Editor in your Supabase dashboard and run the following script:

```sql
-- Fix Storage Bucket Permissions
-- This ensures photos can be uploaded and viewed properly

-- Make sure buckets are public (for profile photos and date images)
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('user-photos', 'date-entry-images');

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view user photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

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

-- Verify the buckets exist and are public
SELECT id, name, public FROM storage.buckets;
```

## Step 3: Verify Storage Setup

Run this query to verify policies are created:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%user photos%'
ORDER BY policyname;
```

## Step 4: Test Photo Upload

After running these scripts:
1. Try uploading a profile photo in the app
2. Check if the photo displays correctly
3. Check Supabase Storage dashboard to see if files are uploaded

## Troubleshooting

If photos still don't upload:
1. Check if the bucket exists in Supabase Storage
2. Verify the bucket is set to public
3. Check browser console for any 403/404 errors
4. Ensure your Supabase URL and anon key are correct in .env file

## Common Issues

1. **"Bucket not found" error**: The storage bucket doesn't exist. Create it in Supabase dashboard.
2. **403 Forbidden**: Storage policies are not correct. Re-run the SQL script above.
3. **Cloudflare HTML responses**: This is now handled by the app's code with fallback URLs.

## Important Notes

- The app now uses unique filenames with timestamps to avoid CDN caching issues
- Photos are uploaded using base64 to ArrayBuffer conversion (Supabase best practice)
- The OptimizedImage component handles CDN errors with automatic fallbacks