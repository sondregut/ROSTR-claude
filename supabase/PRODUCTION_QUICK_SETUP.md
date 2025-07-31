# Production Supabase Quick Setup

## Step 1: Run SQL Scripts (In Order!)

Go to **SQL Editor** in your Supabase dashboard and run these scripts in this exact order:

### 1.1 Base Schema
```bash
# Run: supabase/schema.sql
```

### 1.2 Additional Tables
```bash
# Run these in order:
supabase/date_tables_additions.sql
supabase/roster_schema.sql
supabase/circle_chat_schema.sql
supabase/add_poll_support.sql
supabase/add_roster_feed_support.sql
```

### 1.3 Storage Setup
```bash
# Run: supabase/storage_setup.sql
```

### 1.4 Security Policies
```bash
# Run these in order:
supabase/rls_policies.sql
supabase/date_tables_rls.sql
supabase/circle_chat_rls.sql
supabase/fix_realtime_policies.sql
```

### 1.5 Functions
```bash
# Run these:
supabase/user_stats_functions.sql
supabase/circle_functions.sql
supabase/fix_stats_functions.sql
```

### 1.6 Enable Real-time
```bash
# Run: supabase/enable_realtime_feed_safe.sql
# Run: supabase/fix_chat_realtime.sql
```

## Step 2: Enable Realtime in Dashboard

Go to **Database → Replication** and enable realtime for these tables:
- ✅ date_entries
- ✅ date_comments
- ✅ date_likes
- ✅ poll_votes
- ✅ circle_chat_messages
- ✅ typing_indicators
- ✅ date_plans

## Step 3: Configure Storage

Go to **Storage** and verify these buckets exist:
- `user-photos` (Public)
- `date-photos` (Public)
- `chat-media` (Authenticated)

If not created by SQL, create them manually.

## Step 4: Configure Authentication

Go to **Authentication → Providers**:

1. **Email** - Should be enabled by default
2. **Apple Sign In** (if using):
   - Services ID: `com.sondregut.rostrdating`
   - Redirect URL: `com.sondregut.rostrdating://auth-callback`
   - Add your certificates

## Step 5: Update Your App

Create `.env.production` in your app:
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 6: Test Connection

Run this SQL to create test data:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- You should see:
-- circles, circle_members, circle_chat_messages
-- date_entries, date_comments, date_likes
-- users, roster_entries, polls, etc.
```

## Step 7: Security Settings

Go to **Settings → API**:
1. Enable RLS on all tables
2. Note your service_role key (keep secure!)
3. Verify anon key is in your app

## Quick Verification

Run this final check:
```sql
-- Check realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🚀 You're Done!

Your production Supabase is ready. Now:
1. Build your app with production env
2. Test real-time features
3. Submit to app stores!

## Troubleshooting

If real-time isn't working:
```sql
-- Reset and re-enable
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS date_entries;
ALTER TABLE date_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE date_entries;
```