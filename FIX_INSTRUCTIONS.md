# Fix Instructions for Phone Authentication

## The Issue
You're getting "Database error saving new user" because:
1. Your Supabase database has a trigger that creates a user profile when auth.users is inserted
2. Your app code also tries to create a user profile  
3. This causes a conflict, especially with phone auth where email might be null

## Solution: Run SQL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the contents of `fix_phone_auth.sql`:
   ```sql
   -- Drop the conflicting trigger
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS handle_new_user();
   ```

## Alternative Solution
If you prefer to keep the database trigger, run `fix_phone_auth_alternative.sql` instead. This updates the trigger to:
- Handle both email and phone authentication
- Prevent duplicate inserts
- Handle errors gracefully

## After Running the SQL
1. Clear your Expo cache: `npx expo start -c`
2. Try phone signup again - it should work!

## What Changed in the App
I've also updated your AuthContext to handle the case where a profile might already exist from a database trigger. It will now:
- Detect duplicate key errors
- Update the existing profile instead of failing

The phone authentication should now work correctly!