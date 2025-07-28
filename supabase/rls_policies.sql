-- Row Level Security (RLS) Policies for RostrDating
-- Execute this AFTER running schema.sql

-- Enable RLS on all tables3 
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_entry_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_entry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all active users" ON public.users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Circles table policies
CREATE POLICY "Anyone can view active circles" ON public.circles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Circle owners can update their circles" ON public.circles
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Circle owners can delete their circles" ON public.circles
  FOR DELETE USING (auth.uid() = owner_id);

-- Circle members table policies
CREATE POLICY "Users can view circle memberships" ON public.circle_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.circle_members cm2 
      WHERE cm2.circle_id = circle_members.circle_id 
      AND cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join circles" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles" ON public.circle_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Circle owners and admins can manage members" ON public.circle_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_members.circle_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Date entries table policies
CREATE POLICY "Users can view public date entries and entries from their circles" ON public.date_entries
  FOR SELECT USING (
    is_private = false OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.circle_id = ANY(shared_circles)
    )
  );

CREATE POLICY "Users can create their own date entries" ON public.date_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own date entries" ON public.date_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own date entries" ON public.date_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations table policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
  );

-- Messages table policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Matches table policies
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (
    auth.uid() = user_1 OR 
    auth.uid() = user_2
  );

CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT WITH CHECK (
    auth.uid() = user_1 OR 
    auth.uid() = user_2
  );

CREATE POLICY "Users can update their match status" ON public.matches
  FOR UPDATE USING (
    auth.uid() = user_1 OR 
    auth.uid() = user_2
  );

-- Date entry likes policies
CREATE POLICY "Users can view likes on visible date entries" ON public.date_entry_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can like date entries" ON public.date_entry_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can unlike date entries" ON public.date_entry_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Date entry comments policies
CREATE POLICY "Users can view comments on visible date entries" ON public.date_entry_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can comment on date entries" ON public.date_entry_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON public.date_entry_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.date_entry_comments
  FOR DELETE USING (auth.uid() = user_id);

-- User photos policies
CREATE POLICY "Users can view photos of active users" ON public.user_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_id AND u.is_active = true
    )
  );

CREATE POLICY "Users can manage their own photos" ON public.user_photos
  FOR ALL USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Helper functions for RLS policies

-- Function to check if user is in same circle as another user
CREATE OR REPLACE FUNCTION users_share_circle(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.circle_members cm1
    JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
    WHERE cm1.user_id = user1_id AND cm2.user_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view another user's profile
CREATE OR REPLACE FUNCTION can_view_user_profile(viewer_id UUID, profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Users can always view their own profile
  IF viewer_id = profile_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if both users are active
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = profile_id AND is_active = true
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if they share a circle or have matched
  RETURN (
    users_share_circle(viewer_id, profile_id) OR
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE (user_1 = viewer_id AND user_2 = profile_id)
         OR (user_1 = profile_id AND user_2 = viewer_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies using helper functions for more complex scenarios
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
CREATE POLICY "Users can view accessible user profiles" ON public.users
  FOR SELECT USING (
    is_active = true AND (
      auth.uid() = id OR
      can_view_user_profile(auth.uid(), id)
    )
  );

-- Storage policies (to be set up in Supabase dashboard)
-- These are examples of what should be configured:

-- CREATE POLICY "Users can upload their own photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'user-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'user-photos');

-- CREATE POLICY "Users can update their own photos" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'user-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete their own photos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'user-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );