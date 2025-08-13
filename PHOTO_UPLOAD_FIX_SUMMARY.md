# Photo Upload Fix Summary

## Issue
Images were being saved as local file URIs instead of being uploaded to Supabase storage, causing them to be lost when the app is updated or reinstalled.

## Solution Implemented

### 1. Storage Bucket Configuration
- Added `circle-photos` bucket to `supabase/create_storage_buckets.sql`
- Added storage policies for circle photos in `supabase/storage_setup.sql`
- Added cleanup logic for orphaned circle photos

### 2. Profile Photo Upload (app/(tabs)/profile.tsx)
- Modified to use `uploadImageToSupabase` function
- Uploads to `user-photos` bucket
- Shows local image immediately for better UX
- Falls back to local URI if upload fails with warning

### 3. Circle Photo Upload (app/circles/[id]/settings.tsx)  
- Modified to use `uploadImageToSupabase` function
- Uploads to `circle-photos` bucket
- Only uploads new photos (checks if URI starts with 'file://')
- Warns user if upload fails but allows them to continue

### 4. Date Entry Photo Upload
- Already implemented correctly in `DateContext.tsx`
- Uses `StorageService.uploadDateEntryImage`
- Uploads to `date-entry-images` bucket

## Supabase Setup Required

Before the photo uploads will work, you need to:

1. Create the storage buckets in Supabase dashboard or run:
   ```sql
   -- Run: supabase/create_storage_buckets.sql
   ```

2. Set up storage policies:
   ```sql
   -- Run: supabase/storage_setup.sql
   ```

3. Ensure your Supabase project has storage enabled

## Testing

1. Profile Photo: Go to Profile tab > tap camera icon > select photo
2. Circle Photo: Go to circle > settings > add group photo
3. Date Entry Photo: Create new update > add photo

All photos should now persist across app updates and reinstalls!