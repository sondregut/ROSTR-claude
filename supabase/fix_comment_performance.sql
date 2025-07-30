-- Fix Comment Performance Issues
-- This script optimizes comment functionality to prevent app freezing

-- Create lightweight versions of the count functions that don't perform heavy operations
CREATE OR REPLACE FUNCTION increment_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Lightweight update - just increment without complex queries
  UPDATE public.date_entries 
  SET comment_count = COALESCE(comment_count, 0) + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Lightweight update - just decrement
  UPDATE public.date_entries 
  SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Lightweight update - just increment
  UPDATE public.date_entries 
  SET like_count = COALESCE(like_count, 0) + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_date_like_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Lightweight update - just decrement
  UPDATE public.date_entries 
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove any triggers that might be causing performance issues
DROP TRIGGER IF EXISTS update_comment_count_on_insert ON public.date_comments;
DROP TRIGGER IF EXISTS update_comment_count_on_delete ON public.date_comments;
DROP TRIGGER IF EXISTS update_like_count_on_insert ON public.date_likes;
DROP TRIGGER IF EXISTS update_like_count_on_delete ON public.date_likes;

-- Optional: Run this to fix any null counts (run only once)
-- UPDATE public.date_entries SET comment_count = 0 WHERE comment_count IS NULL;
-- UPDATE public.date_entries SET like_count = 0 WHERE like_count IS NULL;