# Storage Setup Script

This script automatically creates the required Supabase storage buckets for RostrDating.

## Prerequisites

1. **Service Role Key**: You need your Supabase service role key (not the anon key)
2. **Environment Variables**: Properly configured .env file

## Getting Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key!)
4. Add it to your `.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key-here...
```

⚠️ **Warning**: The service role key has admin privileges. Keep it secret and never commit it to git!

## What the Script Creates

The script creates 3 storage buckets with these specifications:

### 1. user-photos
- **Type**: Public
- **Size Limit**: 5MB
- **File Types**: JPEG, PNG, WebP, GIF
- **Purpose**: User profile photos

### 2. date-entry-images  
- **Type**: Public
- **Size Limit**: 10MB
- **File Types**: JPEG, PNG, WebP
- **Purpose**: Images attached to date entries

### 3. chat-media
- **Type**: Private
- **Size Limit**: 20MB
- **File Types**: JPEG, PNG, WebP, GIF, MP4, MOV, AVI  
- **Purpose**: Media shared in chat messages

## Usage

### Method 1: NPM Script (Recommended)
```bash
npm run setup-storage
```

### Method 2: Direct Node Execution
```bash
node scripts/setup-storage.js
```

## Sample Output

```
🚀 RostrDating Storage Bucket Setup

✅ Environment variables validated
📍 Supabase URL: https://your-project.supabase.co
🔑 Service role key: eyJhbGciOiJIUzI1NiIs...

Creating bucket: user-photos
  ✅ Successfully created bucket 'user-photos'
     - Public: true
     - Size limit: 5MB
     - MIME types: image/jpeg, image/png, image/webp, image/gif

Creating bucket: date-entry-images
  ✅ Successfully created bucket 'date-entry-images'
     - Public: true
     - Size limit: 10MB
     - MIME types: image/jpeg, image/png, image/webp

Creating bucket: chat-media
  ✅ Successfully created bucket 'chat-media'
     - Public: false
     - Size limit: 20MB
     - MIME types: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/mov, video/avi

📋 Verification - Listing all buckets:
  ✅ user-photos (Public)
  ✅ date-entry-images (Public)  
  ✅ chat-media (Private)

📊 Summary:
✅ Successfully created: 3/3 buckets

🎉 All storage buckets created successfully!
Your Supabase backend is now fully configured and ready to use.
```

## Troubleshooting

### Missing Environment Variables
If you see this error:
```
Missing required environment variables:
  - SUPABASE_SERVICE_ROLE_KEY
```

**Solution**: Add your service role key to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Authentication Error
If you see HTTP 401/403 errors:
```
Failed to create bucket: HTTP 401
```

**Solution**: 
- Verify you're using the **service_role** key, not the anon key
- Check that the key is correctly copied (no extra spaces/characters)

### Bucket Already Exists
If you see:
```
⚠️ Bucket 'user-photos' already exists, skipping...
```

**This is normal!** The script safely skips existing buckets.

### Network/Connection Issues
If you see connection errors:
```
Script failed: connect ECONNREFUSED
```

**Solution**:
- Check your internet connection
- Verify your Supabase URL is correct
- Ensure Supabase service is available

## Manual Alternative

If the script fails, you can create buckets manually:

1. Go to **Storage** in your Supabase Dashboard
2. Click **"New bucket"**
3. Use the specifications listed above for each bucket

## Security Notes

- The service role key has full admin access to your Supabase project
- Never commit this key to version control
- Consider using environment-specific keys for different deployments
- Rotate keys regularly for production applications

## Next Steps

After running this script successfully:

1. ✅ Your storage buckets are configured
2. ✅ Your database schema is set up
3. ✅ RLS policies are active
4. ✅ Your backend is production-ready!

You can now:
- Test file uploads in your app
- Start developing features that use storage
- Deploy your app with confidence