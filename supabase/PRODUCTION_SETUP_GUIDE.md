# RostrDating Production Setup Guide

## Prerequisites
- Supabase account
- Access to Supabase SQL Editor

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: RostrDating-Production (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Choose based on your needs

## Step 2: Execute Database Schema

Execute the following SQL files in order in the Supabase SQL Editor:

### 2.1 Base Schema
```sql
-- Run the contents of: supabase/schema.sql
```

### 2.2 Additional Date Tables
```sql
-- Run the contents of: supabase/date_tables_additions.sql
```

### 2.3 Circle Chat Schema
```sql
-- Run the contents of: supabase/circle_chat_schema.sql
```

### 2.4 Storage Setup
```sql
-- Run the contents of: supabase/storage_setup.sql
```

## Step 3: Enable Row Level Security (RLS)

Execute the following SQL files in order:

### 3.1 Base RLS Policies
```sql
-- Run the contents of: supabase/rls_policies.sql
```

### 3.2 Date Tables RLS
```sql
-- Run the contents of: supabase/date_tables_rls.sql
```

### 3.3 Realtime Policies
```sql
-- Run the contents of: supabase/fix_realtime_policies.sql
```

## Step 4: Configure Authentication

1. Go to Authentication → Providers in Supabase Dashboard
2. Enable the following providers:
   - **Email**: Already enabled by default
   - **Apple**: 
     - Add your Service ID
     - Add your Team ID
     - Upload your Private Key
     - Configure redirect URLs

## Step 5: Configure Storage

1. Go to Storage in Supabase Dashboard
2. Verify these buckets exist:
   - `user-photos`
   - `date-photos`
   - `chat-media`
3. Set up storage policies (if not already created by SQL):
   - Users can upload to their own folders
   - Public read access for user photos
   - Restricted access for chat media

## Step 6: Update Environment Variables

Update your `.env` file with production values:

```env
EXPO_PUBLIC_SUPABASE_URL=your-production-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## Step 7: Enable Realtime

1. Go to Database → Replication in Supabase Dashboard
2. Enable replication for:
   - `circle_chat_messages`
   - `circle_chat_members`
   - `date_entries` (optional, for live feed updates)

## Step 8: Test the Setup

1. Create a test user account
2. Verify you can:
   - Sign up and sign in
   - Create a profile
   - Upload a photo
   - Create a circle
   - Add a date entry

## Step 9: Production Checklist

- [ ] All SQL files executed successfully
- [ ] RLS is enabled on all tables
- [ ] Authentication providers configured
- [ ] Storage buckets created with proper policies
- [ ] Environment variables updated
- [ ] Realtime enabled for necessary tables
- [ ] Basic functionality tested

## Monitoring and Maintenance

1. **Monitor Database Performance**:
   - Check slow queries in Supabase Dashboard
   - Monitor database size

2. **Security**:
   - Regularly review RLS policies
   - Monitor failed authentication attempts
   - Check for unusual activity

3. **Backups**:
   - Supabase automatically backs up your database
   - Consider setting up additional backup strategies for critical data

## Troubleshooting

### Common Issues:

1. **RLS Policy Errors**:
   - Check that auth.uid() is not null
   - Verify user has proper permissions
   - Check policy conditions

2. **Storage Upload Failures**:
   - Verify storage policies
   - Check file size limits
   - Ensure proper bucket permissions

3. **Authentication Issues**:
   - Verify redirect URLs are correct
   - Check provider configurations
   - Review auth logs in Supabase Dashboard

## Support

For issues specific to:
- **Supabase**: Check their [documentation](https://supabase.com/docs) or [Discord](https://discord.supabase.com)
- **RostrDating**: Review the codebase documentation or create an issue