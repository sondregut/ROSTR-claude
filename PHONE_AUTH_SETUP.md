# Phone Authentication Setup Guide

## Overview
This guide will help you fix the phone authentication issues in your RostrDating app.

## Prerequisites
1. Access to your Supabase project dashboard
2. Phone authentication provider (Twilio) configured in Supabase

## Step 1: Configure Supabase Phone Auth Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** in the list and enable it
4. Configure your SMS provider (Twilio recommended):
   - Sign up for a [Twilio account](https://www.twilio.com)
   - Get your Account SID, Auth Token, and a phone number
   - Enter these credentials in Supabase Phone provider settings
   - Set the SMS message template (optional)

## Step 2: Run Database Migration

1. Go to your Supabase project's **SQL Editor**
2. Copy the entire contents of `supabase/complete_phone_auth_fix.sql`
3. Paste and run the SQL script
4. Check the output to ensure all steps completed successfully

The script will:
- Make email nullable for phone-only users
- Fix database triggers that conflict with phone auth
- Add proper constraints and indexes
- Update RLS policies
- Create helper functions

## Step 3: Test Phone Authentication

1. **Send OTP:**
   ```bash
   # The app should now properly send SMS codes
   # Check Supabase logs: Authentication → Logs
   ```

2. **Common Issues:**
   - **"Database error saving new user"**: The SQL migration should fix this
   - **SMS not received**: Check Twilio logs and balance
   - **Invalid token error**: Ensure you're entering the correct 6-digit code

## Step 4: Verify Setup

Run this query in Supabase SQL Editor to check recent auth attempts:

```sql
-- Check recent auth logs
SELECT 
    id,
    created_at,
    raw_user_meta_data->>'phone' as phone,
    raw_user_meta_data->>'error' as error
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check if users are being created properly
SELECT 
    id,
    email,
    phone,
    name,
    created_at
FROM public.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Troubleshooting

### Issue: SMS not being sent
1. Check Twilio console for errors
2. Verify phone number format (+1234567890)
3. Check Supabase logs for SMS sending errors

### Issue: "Invalid token" error
1. Ensure the OTP is exactly 6 digits
2. Check if the code has expired (usually 60 seconds)
3. Try requesting a new code

### Issue: Stuck on "VERIFYING..."
This has been fixed with:
- Proper route navigation
- Timeout handling (30 seconds)
- Better error handling

### Issue: Can't manually enter code
Fixed with invisible input overlay that supports:
- Manual typing
- iOS SMS autofill
- Copy/paste functionality

## Testing in Development

For development testing without sending real SMS:
1. Enable "Test OTP" in Supabase Phone settings
2. Use the test phone number and OTP code provided
3. Or check Supabase logs for the OTP code instead of SMS

## Additional Notes

- The app now supports both email and phone authentication
- Users can have either email OR phone (not necessarily both)
- The profile setup flow has been updated to collect name after phone verification
- All database constraints have been updated to support this flow