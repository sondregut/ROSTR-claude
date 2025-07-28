# RostrDating Supabase Setup Guide

This guide will walk you through setting up your Supabase backend for the RostrDating app.

## Prerequisites

1. A Supabase account at [supabase.com](https://supabase.com)
2. Your project's environment variables already configured in `.env`

## Step 1: Execute SQL Scripts

Execute these SQL files in order in your Supabase SQL Editor:

### 1.1 Database Schema
```sql
-- Execute: supabase/schema.sql
-- This creates all tables, indexes, triggers, and basic functions
```

### 1.2 Row Level Security Policies
```sql
-- Execute: supabase/rls_policies.sql
-- This sets up security policies for all tables
```

### 1.3 Storage Setup
```sql
-- Execute: supabase/storage_setup.sql
-- This creates storage policies and functions
```

### 1.4 Matching Functions
```sql
-- Execute: supabase/matching_functions.sql
-- This creates advanced matching algorithm functions
```

## Step 2: Create Storage Buckets

In your Supabase Dashboard, go to **Storage** and create these buckets:

### 2.1 user-photos
- **Name**: `user-photos`
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed file types**: `image/jpeg, image/png, image/webp, image/gif`

### 2.2 date-entry-images
- **Name**: `date-entry-images`
- **Public**: ✅ Yes
- **File size limit**: 10MB
- **Allowed file types**: `image/jpeg, image/png, image/webp`

### 2.3 chat-media
- **Name**: `chat-media`
- **Public**: ❌ No (Private)
- **File size limit**: 20MB
- **Allowed file types**: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/mov`

## Step 3: Configure Authentication

### 3.1 SMS Authentication (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure your SMS provider (Twilio recommended):
   - Add your Twilio Account SID
   - Add your Twilio Auth Token
   - Add your Twilio phone number

### 3.2 Email Authentication
1. Go to **Authentication** → **Settings**
2. Configure your SMTP settings or use Supabase's built-in email service
3. Customize email templates if needed

### 3.3 URL Configuration
1. Set **Site URL** to your app's URL
2. Add redirect URLs for development and production

## Step 4: Environment Variables

Ensure your `.env` file has:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Database Seeding (Optional)

### 5.1 Create Test Users
```sql
-- Insert test users for development
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'test1@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'test2@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

-- The trigger will automatically create user profiles
```

### 5.2 Create Test Circles
```sql
INSERT INTO public.circles (name, description, owner_id)
VALUES 
  ('College Friends', 'Friends from university', '550e8400-e29b-41d4-a716-446655440001'),
  ('Work Colleagues', 'People from work', '550e8400-e29b-41d4-a716-446655440002');
```

## Step 6: Verify Setup

### 6.1 Test Database Connection
Run this query to verify tables are created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- circles
- circle_members
- conversations
- date_entries
- date_entry_comments
- date_entry_likes
- matches
- messages
- reports
- user_photos
- users

### 6.2 Test RLS Policies
```sql
-- This should return data only for authenticated users
SELECT * FROM public.users;
```

### 6.3 Test Storage
Try uploading a file through your app to verify storage buckets work correctly.

## Step 7: Production Considerations

### 7.1 Database Performance
1. Monitor query performance in Supabase Dashboard
2. Add additional indexes if needed for your specific use case
3. Consider upgrading your Supabase plan for production workloads

### 7.2 Security
1. Review and audit all RLS policies
2. Set up database backups
3. Monitor auth logs for suspicious activity
4. Consider implementing rate limiting

### 7.3 Monitoring
1. Set up alerts for database errors
2. Monitor storage usage
3. Track authentication metrics
4. Set up logging for critical operations

## Step 8: Common Issues and Solutions

### 8.1 RLS Policy Errors
**Problem**: Getting "permission denied" errors
**Solution**: Check that RLS policies are correctly set up and user is properly authenticated

### 8.2 Storage Upload Failures
**Problem**: File uploads failing
**Solution**: 
- Check bucket policies are correctly configured
- Verify file size limits
- Ensure proper CORS settings

### 8.3 Real-time Subscriptions Not Working
**Problem**: Real-time updates not received
**Solution**:
- Check that realtime is enabled for your tables
- Verify subscription channels are properly configured
- Check network connectivity

### 8.4 SMS Authentication Issues
**Problem**: SMS codes not being sent
**Solution**:
- Verify Twilio credentials are correct
- Check phone number format (+1234567890)
- Ensure sufficient Twilio credits

## Step 9: Maintenance Tasks

Set up these periodic maintenance tasks:

### 9.1 Clean Up Orphaned Files
```sql
-- Run weekly
SELECT cleanup_orphaned_files();
```

### 9.2 Update User Statistics
```sql
-- Run daily
SELECT refresh_user_compatibility();
```

### 9.3 Archive Old Data
```sql
-- Archive old messages/conversations as needed
-- Create custom scripts based on your retention policy
```

## Support

If you encounter issues:

1. Check the Supabase Dashboard for error logs
2. Review the browser console for client-side errors
3. Verify your environment variables are correct
4. Check that all SQL scripts executed successfully

## Next Steps

After completing this setup:

1. Test all authentication flows
2. Verify file upload functionality
3. Test real-time chat features
4. Run matching algorithms with test data
5. Deploy to production environment

Your Supabase backend should now be fully configured and ready for production use!