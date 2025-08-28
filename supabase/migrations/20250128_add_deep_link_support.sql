-- Add deep link support to circle_members table
-- This migration adds the invited_by column to track who invited users to circles

-- Add invited_by column to track inviter name
ALTER TABLE public.circle_members 
ADD COLUMN invited_by TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.circle_members.invited_by IS 'Name of the person who invited this user to the circle (for deep link tracking)';

-- No RLS changes needed - existing policies should cover this column