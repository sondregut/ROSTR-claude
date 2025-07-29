# Upgrading Existing Supabase Project for Production

## ⚠️ IMPORTANT: Backup First!
Before making any changes, export your existing data if you need to keep it.

## Step 1: Check Current Schema

First, check what tables already exist to avoid conflicts:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Step 2: Add Missing Tables

### Check if these tables exist, if not, create them:

```sql
-- Check for date_plans table
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'date_plans'
);

-- If false, run date_tables_additions.sql
```

## Step 3: Clean Up Test Data (Optional but Recommended)

```sql
-- Delete all test data (DANGEROUS - only if you're sure!)
-- This will cascade delete related data

-- Option A: Delete everything except your own test account
DELETE FROM auth.users WHERE email NOT LIKE '%@yourdomain.com';

-- Option B: Delete specific test users
DELETE FROM auth.users WHERE email IN ('test@example.com', 'demo@example.com');

-- Option C: Keep all users but clean their data
TRUNCATE TABLE date_entries CASCADE;
TRUNCATE TABLE circles CASCADE;
TRUNCATE TABLE conversations CASCADE;
-- etc.
```

## Step 4: Update RLS Policies

Drop existing policies and recreate them to ensure they're correct:

```sql
-- Drop all existing policies for a table
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
-- ... drop all other policies

-- Then run rls_policies.sql and date_tables_rls.sql
```

## Step 5: Verify Storage Buckets

Check existing buckets:
```sql
SELECT * FROM storage.buckets;
```

If missing, create them:
```sql
-- Run storage_setup.sql
```

## Step 6: Enable RLS on All Tables

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS on any tables where rowsecurity = false
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

## Step 7: Production Checklist

- [ ] All test data cleaned up
- [ ] All required tables exist
- [ ] RLS enabled on all tables
- [ ] RLS policies updated
- [ ] Storage buckets configured
- [ ] No exposed secrets in database