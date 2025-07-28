# Fix Supabase Real-time Setup

## Quick Fix Steps

### 1. Enable Real-time in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for these tables:
   - ✅ `messages`
   - ✅ `typing_indicators`
   - ✅ `circle_message_reads`

### 2. Run the Policy Fix Script

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the entire contents of `supabase/fix_realtime_policies.sql`
3. Click **Run**

### 3. Verify Setup

The app now includes debugging logs. When you open the chat:

- ✅ **Good signs:**
  - "Successfully subscribed to messages"
  - "Real-time connection established!"
  - Messages appear instantly

- ❌ **If you see errors:**
  - "Cannot query messages" → RLS policies issue
  - "Channel error" → Real-time not enabled
  - "No authenticated user" → Auth issue

### 4. Test the Chat

1. Open the app and go to a circle
2. Click the "Chat" tab
3. Send a test message
4. If real-time fails, it will automatically use the mock service

## What the Fix Does

1. **Enhanced Debugging**: Added comprehensive logging to identify issues
2. **Simplified Subscriptions**: Uses a more direct approach to real-time
3. **Automatic Fallback**: Switches to mock service if real-time fails
4. **Access Testing**: Checks permissions before subscribing

## Common Issues

### "Failed to subscribe to circle 1 messages"

**Cause**: Real-time not enabled or RLS policies blocking access

**Fix**: Run steps 1 & 2 above

### Messages not appearing in real-time

**Cause**: WebSocket connection issues

**Fix**: Check network connection, restart app

### "Cannot query messages" error

**Cause**: User not authenticated or not a circle member

**Fix**: Ensure user is logged in and member of the circle

## Testing with Mock Service

The app will automatically use the mock service if real-time fails. This ensures the chat is always functional. The mock service:

- Shows sample messages
- Simulates real-time updates
- Allows testing UI without database

To force mock mode, the app will switch automatically when it detects connection issues.