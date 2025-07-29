-- Additional tables for date planning and engagement features
-- Execute this AFTER running schema.sql

-- Date plans table (for future dates)
CREATE TABLE IF NOT EXISTS public.date_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Date likes table (renamed from date_entry_likes for consistency)
CREATE TABLE IF NOT EXISTS public.date_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_entry_id, user_id)
);

-- Date comments table (renamed from date_entry_comments for consistency)
CREATE TABLE IF NOT EXISTS public.date_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan likes table
CREATE TABLE IF NOT EXISTS public.plan_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_plan_id UUID REFERENCES public.date_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_plan_id, user_id)
);

-- Plan comments table
CREATE TABLE IF NOT EXISTS public.plan_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_plan_id UUID REFERENCES public.date_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  option_index INTEGER NOT NULL CHECK (option_index >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_entry_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_date_plans_user_id ON public.date_plans(user_id);
CREATE INDEX idx_date_plans_date ON public.date_plans(date);
CREATE INDEX idx_date_likes_date_entry_id ON public.date_likes(date_entry_id);
CREATE INDEX idx_date_comments_date_entry_id ON public.date_comments(date_entry_id);
CREATE INDEX idx_plan_likes_date_plan_id ON public.plan_likes(date_plan_id);
CREATE INDEX idx_plan_comments_date_plan_id ON public.plan_comments(date_plan_id);
CREATE INDEX idx_poll_votes_date_entry_id ON public.poll_votes(date_entry_id);

-- RPC functions for incrementing/decrementing counts
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

CREATE OR REPLACE FUNCTION increment_date_comment_count(date_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.date_entries 
  SET comment_count = comment_count + 1 
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_circle_member_count(circle_id UUID, increment_by INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE public.circles 
  SET member_count = member_count + increment_by 
  WHERE id = circle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_circle_member_count(circle_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.circles 
  SET member_count = GREATEST(0, member_count - 1) 
  WHERE id = circle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;