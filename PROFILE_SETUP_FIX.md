# Profile Setup Fix Instructions

## The Issue
Profile setup is failing after phone authentication due to database schema mismatches.

## Quick Fix - Run this SQL first:

```sql
-- Make email nullable for phone auth users
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or phone exists
ALTER TABLE public.users ADD CONSTRAINT users_email_or_phone_check 
CHECK (email IS NOT NULL OR phone IS NOT NULL);
```

## What I've Fixed in the Code:

1. **Username generation** - Now creates unique usernames to avoid conflicts
2. **Email/Phone handling** - Properly handles users who sign up with phone only
3. **Gender field** - Correctly stores gender as enum type
4. **Date of birth** - Stores both age and date_of_birth fields
5. **Better error handling** - Logs detailed errors and auto-retries on username conflicts

## To Debug:

1. Open the app console to see detailed logs
2. Try completing the profile form
3. Check console for these logs:
   - "Profile data to save:"
   - "Existing profile:"
   - Any error details

## Common Issues:

1. **"null value in column 'email'"** - Run the SQL above to make email nullable
2. **"duplicate key value violates unique constraint"** - The code now auto-generates new usernames
3. **"invalid input value for enum user_gender"** - Make sure gender is 'male', 'female', or 'other'

## Next Steps:

1. Run the SQL in Supabase Dashboard
2. Restart the app: `npx expo start -c`
3. Try the profile setup again
4. Share any error logs if it still fails