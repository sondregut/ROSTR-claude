# Poll Support Migration

## Overview
This migration adds poll support to date entries, allowing users to create polls that their friends can vote on.

## Files to Execute
Run the following SQL migration in your Supabase SQL editor:

1. `/supabase/add_poll_support.sql` - Adds poll fields to date_entries table and creates/updates poll_votes table

## What This Migration Does
1. Adds `poll_question` and `poll_options` columns to the `date_entries` table (if they don't exist)
2. Creates a new `poll_votes` table to track user votes (if it doesn't exist)
3. Drops and recreates Row Level Security (RLS) policies for poll voting to avoid conflicts
4. Creates indexes for performance (if they don't exist)

## To Run the Migration
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `/supabase/add_poll_support.sql`
4. Paste and execute the SQL

## Note on Existing Tables
This migration is safe to run even if some objects already exist:
- It uses `IF NOT EXISTS` clauses for tables and indexes
- It drops existing policies before recreating them to avoid conflicts
- It uses `ADD COLUMN IF NOT EXISTS` for new columns

## Verify the Migration
After running the migration, you can verify it worked by checking:
- The `date_entries` table should have `poll_question` and `poll_options` columns
- The `poll_votes` table should exist with proper structure
- RLS policies should be enabled on `poll_votes` with the correct rules

## Test the Feature
1. Create a new date with a poll
2. The poll should appear in the feed
3. Users should be able to vote on polls
4. Vote counts should update when refreshing the feed