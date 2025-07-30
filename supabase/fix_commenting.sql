-- Fix commenting functionality
-- This migration ensures all necessary tables, functions, and policies exist for comments

-- Create date_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.date_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_date_comments_date_entry_id ON public.date_comments(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_date_comments_user_id ON public.date_comments(user_id);

-- Enable RLS
ALTER TABLE public.date_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view comments on visible date entries" ON public.date_comments;
DROP POLICY IF EXISTS "Users can comment on date entries" ON public.date_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.date_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.date_comments;

-- Recreate policies
-- Users can view comments on date entries they can see
CREATE POLICY "Users can view comments on visible date entries" ON public.date_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_comments.date_entry_id
      AND (
        -- Own dates
        de.user_id = auth.uid() 
        -- Or dates shared in user's circles
        OR EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

-- Users can comment on date entries they can see
CREATE POLICY "Users can comment on date entries" ON public.date_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        -- Own dates
        de.user_id = auth.uid() 
        -- Or dates shared in user's circles
        OR EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.date_comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.date_comments
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create or replace the increment comment count function
CREATE OR REPLACE FUNCTION increment_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET comment_count = comment_count + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the decrement comment count function
CREATE OR REPLACE FUNCTION decrement_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET comment_count = GREATEST(0, comment_count - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure like count functions exist
CREATE OR REPLACE FUNCTION increment_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET like_count = like_count + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET like_count = GREATEST(0, like_count - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure comment_count and like_count columns exist on date_entries
ALTER TABLE public.date_entries 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Update existing entries to have correct counts
UPDATE public.date_entries de
SET comment_count = (
  SELECT COUNT(*) 
  FROM public.date_comments dc 
  WHERE dc.date_entry_id = de.id
);

UPDATE public.date_entries de
SET like_count = (
  SELECT COUNT(*) 
  FROM public.date_likes dl 
  WHERE dl.date_entry_id = de.id
);

-- Create date_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.date_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_entry_id, user_id)
);

-- Enable RLS on date_likes
ALTER TABLE public.date_likes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate date_likes policies
DROP POLICY IF EXISTS "Users can view likes on visible date entries" ON public.date_likes;
DROP POLICY IF EXISTS "Users can like date entries" ON public.date_likes;
DROP POLICY IF EXISTS "Users can unlike date entries" ON public.date_likes;

-- Users can view likes
CREATE POLICY "Users can view likes on visible date entries" ON public.date_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_likes.date_entry_id
      AND (
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

-- Users can like
CREATE POLICY "Users can like date entries" ON public.date_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

-- Users can unlike
CREATE POLICY "Users can unlike date entries" ON public.date_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for likes
CREATE INDEX IF NOT EXISTS idx_date_likes_date_entry_id ON public.date_likes(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_date_likes_user_id ON public.date_likes(user_id);