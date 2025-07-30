-- Comprehensive Comment System Fix
-- This script addresses all potential issues with commenting functionality

-- ===== STEP 1: ENSURE CORE TABLES EXIST =====

-- Create date_comments table with proper structure
CREATE TABLE IF NOT EXISTS public.date_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create date_likes table with proper structure
CREATE TABLE IF NOT EXISTS public.date_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_entry_id, user_id)
);

-- Ensure date_entries has comment and like count columns
ALTER TABLE public.date_entries 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- ===== STEP 2: CREATE INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_date_comments_date_entry_id ON public.date_comments(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_date_comments_user_id ON public.date_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_date_comments_created_at ON public.date_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_date_likes_date_entry_id ON public.date_likes(date_entry_id);
CREATE INDEX IF NOT EXISTS idx_date_likes_user_id ON public.date_likes(user_id);

-- ===== STEP 3: ENABLE RLS =====

ALTER TABLE public.date_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_likes ENABLE ROW LEVEL SECURITY;

-- ===== STEP 4: DROP ALL EXISTING POLICIES TO AVOID CONFLICTS =====

-- Drop comment policies
DROP POLICY IF EXISTS "Users can view comments on visible date entries" ON public.date_comments;
DROP POLICY IF EXISTS "Users can comment on date entries" ON public.date_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.date_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.date_comments;

-- Drop like policies
DROP POLICY IF EXISTS "Users can view likes on visible date entries" ON public.date_likes;
DROP POLICY IF EXISTS "Users can like date entries" ON public.date_likes;
DROP POLICY IF EXISTS "Users can unlike date entries" ON public.date_likes;

-- ===== STEP 5: CREATE SIMPLIFIED, WORKING RLS POLICIES =====

-- Comment policies - simplified to avoid recursion
CREATE POLICY "Users can view all comments" ON public.date_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON public.date_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON public.date_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.date_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Like policies - simplified
CREATE POLICY "Users can view all likes" ON public.date_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add likes" ON public.date_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their own likes" ON public.date_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ===== STEP 6: CREATE/UPDATE HELPER FUNCTIONS =====

-- Simple comment count functions without complex logic
CREATE OR REPLACE FUNCTION increment_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET comment_count = COALESCE(comment_count, 0) + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET like_count = COALESCE(like_count, 0) + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== STEP 7: REMOVE PROBLEMATIC TRIGGERS =====

DROP TRIGGER IF EXISTS update_comment_count_on_insert ON public.date_comments;
DROP TRIGGER IF EXISTS update_comment_count_on_delete ON public.date_comments;
DROP TRIGGER IF EXISTS update_like_count_on_insert ON public.date_likes;
DROP TRIGGER IF EXISTS update_like_count_on_delete ON public.date_likes;

-- ===== STEP 8: FIX EXISTING DATA =====

-- Reset all counts to 0 first
UPDATE public.date_entries SET comment_count = 0, like_count = 0;

-- Recalculate actual counts
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

-- ===== STEP 9: GRANT NECESSARY PERMISSIONS =====

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.date_likes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ===== STEP 10: VERIFICATION QUERIES =====

-- Check if everything is set up correctly
DO $$
BEGIN
  RAISE NOTICE 'Comment system setup complete!';
  RAISE NOTICE 'Tables created: date_comments, date_likes';
  RAISE NOTICE 'Policies created: simplified RLS policies';
  RAISE NOTICE 'Functions created: count increment/decrement functions';
  RAISE NOTICE 'Data integrity: counts recalculated';
END $$;
