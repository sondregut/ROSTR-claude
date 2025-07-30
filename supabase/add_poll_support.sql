-- Add poll support to date_entries table
-- This migration adds fields for creating polls on date entries

-- Add poll fields to date_entries table
ALTER TABLE public.date_entries
ADD COLUMN IF NOT EXISTS poll_question VARCHAR(500),
ADD COLUMN IF NOT EXISTS poll_options JSONB;

-- Create poll_votes table to track user votes (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_entry_id UUID NOT NULL REFERENCES date_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL CHECK (option_index >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one vote per user per poll
  UNIQUE(date_entry_id, user_id)
);

-- Add RLS policies for poll_votes (drop existing ones first to avoid conflicts)
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view poll votes on accessible dates" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.poll_votes;

-- Recreate policies
-- Users can see all votes on polls they can access
CREATE POLICY "Users can view poll votes on accessible dates" ON public.poll_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM date_entries d
      WHERE d.id = poll_votes.date_entry_id
      AND (
        -- Own dates
        d.user_id = auth.uid()
        -- Or dates shared in user's circles
        OR EXISTS (
          SELECT 1 FROM circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(d.shared_circles)
        )
      )
    )
  );

-- Users can create their own votes
CREATE POLICY "Users can create their own votes" ON public.poll_votes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own votes
CREATE POLICY "Users can update their own votes" ON public.poll_votes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON public.poll_votes
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_poll_votes_date_entry_id ON public.poll_votes(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);

-- Add comments (will update if already exist)
COMMENT ON COLUMN public.date_entries.poll_question IS 'Optional poll question for the date entry';
COMMENT ON COLUMN public.date_entries.poll_options IS 'JSON array of poll options with text and vote count';
COMMENT ON TABLE public.poll_votes IS 'Tracks user votes on date entry polls';