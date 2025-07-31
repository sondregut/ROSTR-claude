-- Create reactions tables for dates and plans
-- This migration adds support for emoji reactions to replace simple likes

-- Create enum for reaction types (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM ('love', 'funny', 'exciting', 'hot', 'awkward', 'fail', 'celebrate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table for date entry reactions
CREATE TABLE IF NOT EXISTS date_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_entry_id UUID NOT NULL REFERENCES date_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one reaction per user per date entry
    UNIQUE(date_entry_id, user_id)
);

-- Create table for plan reactions
CREATE TABLE IF NOT EXISTS plan_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES date_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one reaction per user per plan
    UNIQUE(plan_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_date_reactions_date_entry_id ON date_reactions(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_date_reactions_user_id ON date_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_date_reactions_type ON date_reactions(reaction_type);

CREATE INDEX IF NOT EXISTS idx_plan_reactions_plan_id ON plan_reactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_reactions_user_id ON plan_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_reactions_type ON plan_reactions(reaction_type);

-- Enable Row Level Security (RLS)
ALTER TABLE date_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view date reactions" ON date_reactions;
DROP POLICY IF EXISTS "Users can insert own date reactions" ON date_reactions;
DROP POLICY IF EXISTS "Users can update own date reactions" ON date_reactions;
DROP POLICY IF EXISTS "Users can delete own date reactions" ON date_reactions;

DROP POLICY IF EXISTS "Anyone can view plan reactions" ON plan_reactions;
DROP POLICY IF EXISTS "Users can insert own plan reactions" ON plan_reactions;
DROP POLICY IF EXISTS "Users can update own plan reactions" ON plan_reactions;
DROP POLICY IF EXISTS "Users can delete own plan reactions" ON plan_reactions;

-- RLS Policies for date_reactions
-- Users can see all reactions
CREATE POLICY "Anyone can view date reactions" ON date_reactions
    FOR SELECT USING (true);

-- Users can only insert their own reactions
CREATE POLICY "Users can insert own date reactions" ON date_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reactions
CREATE POLICY "Users can update own date reactions" ON date_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own reactions
CREATE POLICY "Users can delete own date reactions" ON date_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for plan_reactions
-- Users can see all reactions
CREATE POLICY "Anyone can view plan reactions" ON plan_reactions
    FOR SELECT USING (true);

-- Users can only insert their own reactions
CREATE POLICY "Users can insert own plan reactions" ON plan_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reactions
CREATE POLICY "Users can update own plan reactions" ON plan_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own reactions
CREATE POLICY "Users can delete own plan reactions" ON plan_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_date_reactions_updated_at ON date_reactions;
CREATE TRIGGER update_date_reactions_updated_at BEFORE UPDATE ON date_reactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_reactions_updated_at ON plan_reactions;
CREATE TRIGGER update_plan_reactions_updated_at BEFORE UPDATE ON plan_reactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration script to convert existing likes to love reactions
-- Only run if the old tables exist
DO $$
BEGIN
    -- Check if date_likes table exists and migrate
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'date_likes') THEN
        INSERT INTO date_reactions (date_entry_id, user_id, reaction_type, created_at)
        SELECT date_entry_id, user_id, 'love'::reaction_type, created_at
        FROM date_likes
        ON CONFLICT (date_entry_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated existing date likes to reactions';
    END IF;

    -- Check if plan_likes table exists and migrate
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_likes') THEN
        -- First check what columns exist in plan_likes
        IF EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'plan_likes' AND column_name = 'plan_id') THEN
            INSERT INTO plan_reactions (plan_id, user_id, reaction_type, created_at)
            SELECT plan_id, user_id, 'love'::reaction_type, created_at
            FROM plan_likes
            ON CONFLICT (plan_id, user_id) DO NOTHING;
        ELSIF EXISTS (SELECT FROM information_schema.columns 
                     WHERE table_name = 'plan_likes' AND column_name = 'date_plan_id') THEN
            -- Some systems might use date_plan_id instead
            INSERT INTO plan_reactions (plan_id, user_id, reaction_type, created_at)
            SELECT date_plan_id, user_id, 'love'::reaction_type, created_at
            FROM plan_likes
            ON CONFLICT (plan_id, user_id) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Migrated existing plan likes to reactions';
    END IF;
END $$;

-- Create views to get reaction counts and user reactions
DROP VIEW IF EXISTS date_reactions_summary;
CREATE VIEW date_reactions_summary AS
SELECT 
    date_entry_id,
    reaction_type,
    COUNT(*) as count,
    ARRAY_AGG(user_id) as user_ids
FROM date_reactions
GROUP BY date_entry_id, reaction_type;

DROP VIEW IF EXISTS plan_reactions_summary;
CREATE VIEW plan_reactions_summary AS
SELECT 
    plan_id,
    reaction_type,
    COUNT(*) as count,
    ARRAY_AGG(user_id) as user_ids
FROM plan_reactions
GROUP BY plan_id, reaction_type;

-- Grant permissions on views
GRANT SELECT ON date_reactions_summary TO authenticated;
GRANT SELECT ON plan_reactions_summary TO authenticated;

-- Optional: Drop the old likes tables after verifying the migration
-- WARNING: Only run these after confirming the migration was successful
-- DROP TABLE IF EXISTS date_likes;
-- DROP TABLE IF EXISTS plan_likes;