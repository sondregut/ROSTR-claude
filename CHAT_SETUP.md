# Chat Feature Setup Guide

The chat feature is currently not working because it requires database setup. Here's how to fix it:

## Current Status
- ✅ Environment variables configured
- ✅ Basic database tables exist  
- ❌ Chat-specific tables missing
- ❌ Real-time subscriptions not enabled

## Quick Fix (Recommended)

### Step 1: Run Database Setup
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/manual-chat-setup.sql`
4. Click **Run** to execute the SQL

### Step 2: Enable Real-time
1. In Supabase dashboard, go to **Database > Replication**
2. Enable real-time for these tables:
   - `messages`
   - `typing_indicators`

### Step 3: Test Chat
1. Restart your Expo app (`npx expo start`)
2. Navigate to any circle and tap the **Chat** tab
3. The status bar should show "✅ Connected" instead of "Demo mode"

## What the Setup Does

The SQL script creates:
- `typing_indicators` table for real-time typing status
- `circle_message_reads` table for read receipts
- Adds `circle_id` column to `messages` table
- Sets up proper Row Level Security (RLS) policies
- Creates helper functions for unread counts
- Adds test data for development

## Current Behavior

**Without Setup:**
- Chat shows "⚠️ Demo mode" warning
- Messages are local-only and don't persist
- No real-time functionality between users
- Falls back to mock service

**After Setup:**
- Real-time messaging between circle members
- Message persistence in database
- Typing indicators
- Read receipts
- Proper authentication and permissions

## Troubleshooting

### Still Seeing Demo Mode?
1. Check console logs for specific error messages
2. Ensure you're signed in (chat requires authentication)
3. Verify you're a member of the circle
4. Confirm real-time is enabled on both tables

### Can't Run SQL?
- Make sure you're using the **service role key** in your environment
- Check that your Supabase project has the required permissions
- Try running sections of the SQL individually

### Real-time Not Working?
1. Go to Database > Replication in Supabase
2. Enable real-time for `messages` and `typing_indicators` tables
3. Click **Save** and wait for replication to start

## Alternative: Keep Using Demo Mode

If you prefer to keep using the demo mode for now:
- Messages will be local-only but functional for UI testing
- Mock responses from other users are simulated
- No database setup required
- Good for development and design work

The app will automatically detect when the database is properly configured and switch to real-time mode.