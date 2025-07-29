-- Create roster_entries table
CREATE TABLE IF NOT EXISTS public.roster_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('active', 'new', 'fading', 'ended', 'ghosted')),
  rating DECIMAL(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  last_date TIMESTAMP WITH TIME ZONE,
  next_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roster_entries_user_id ON public.roster_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_roster_entries_status ON public.roster_entries(status);
CREATE INDEX IF NOT EXISTS idx_roster_entries_updated_at ON public.roster_entries(updated_at);

-- Add RLS policies
ALTER TABLE public.roster_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own roster entries
CREATE POLICY "Users can view their own roster entries" ON public.roster_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own roster entries
CREATE POLICY "Users can create their own roster entries" ON public.roster_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own roster entries
CREATE POLICY "Users can update their own roster entries" ON public.roster_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own roster entries
CREATE POLICY "Users can delete their own roster entries" ON public.roster_entries
  FOR DELETE USING (auth.uid() = user_id);