-- Migration to remove distance and lifestyle preferences
-- Run this in Supabase SQL Editor

-- Since preferences are stored as JSONB, we need to update the existing data
-- to remove the distance field from dating preferences and remove lifestyle entirely

-- Update all user records to remove distance from dating preferences
UPDATE public.users
SET dating_preferences = dating_preferences - 'distance'
WHERE dating_preferences ? 'distance';

-- Remove the entire lifestyle_preferences column data
UPDATE public.users
SET lifestyle_preferences = '{}'::jsonb;

-- Optional: Add a check constraint to ensure these fields don't get added back
-- This will prevent any inserts/updates that try to add these fields
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS check_dating_preferences_format;

ALTER TABLE public.users
ADD CONSTRAINT check_dating_preferences_format
CHECK (
  NOT (dating_preferences ? 'distance')
);

-- Log the migration
INSERT INTO public.migrations (name, executed_at)
VALUES ('remove_lifestyle_distance_preferences', NOW())
ON CONFLICT DO NOTHING;

-- Note: If you don't have a migrations table, you can create one:
-- CREATE TABLE IF NOT EXISTS public.migrations (
--   id SERIAL PRIMARY KEY,
--   name TEXT UNIQUE NOT NULL,
--   executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );