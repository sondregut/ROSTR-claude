# Roster Image Upload Fix

## Issues Fixed

### 1. Duplicate Storage Bucket Error
- **Problem**: Running `create_storage_buckets.sql` would fail with "duplicate key" error if buckets already existed
- **Solution**: Added `ON CONFLICT (id) DO NOTHING` to all INSERT statements, making the script idempotent

### 2. Roster Images Not Persisting
- **Problem**: Roster person images were only saved as local file URIs, lost on app reinstall/update
- **Solution**: Updated `RosterContext.tsx` to upload images to Supabase storage

## Implementation Details

### Storage Bucket Fix (`supabase/create_storage_buckets.sql`)
```sql
INSERT INTO storage.buckets (...) 
VALUES (...)
ON CONFLICT (id) DO NOTHING;
```

### Roster Image Upload (`contexts/RosterContext.tsx`)
1. **Add Person**: When adding a new person, photos are uploaded to Supabase before saving
2. **Update Person**: When editing a person, new photos are uploaded and URLs updated
3. **Fallback**: If upload fails, keeps local URI with console error logging

### Storage Location
- Roster photos use the `user-photos` bucket (same as profile photos)
- Photos are organized by user ID in the bucket structure

## Testing

1. **Add New Person**:
   - Go to Roster tab > Add person
   - Add photos
   - Save and verify images appear in roster list

2. **Edit Person**:
   - Edit existing person
   - Change/add photos
   - Save and verify images update

3. **Persistence**:
   - Force quit and reopen app
   - Images should still display correctly

## Note
The fix gracefully handles upload failures by keeping the local URI as a fallback, ensuring the app continues to function even if Supabase storage is unavailable.