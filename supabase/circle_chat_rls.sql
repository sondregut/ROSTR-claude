-- RLS Policies for Circle Chat Tables
-- Run this AFTER create_circle_chat_tables.sql

-- Enable RLS on circle chat tables
ALTER TABLE public.circle_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_chat_reactions ENABLE ROW LEVEL SECURITY;

-- Circle chat messages policies
CREATE POLICY "Users can view messages in their circles" ON public.circle_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_chat_messages.circle_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their circles" ON public.circle_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_chat_messages.circle_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages" ON public.circle_chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.circle_chat_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Circle chat members policies
CREATE POLICY "Users can view chat members in their circles" ON public.circle_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_chat_members.circle_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chat member status" ON public.circle_chat_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Circle chat reactions policies
CREATE POLICY "Users can view reactions in their circles" ON public.circle_chat_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_chat_messages ccm
      JOIN public.circle_members cm ON cm.circle_id = ccm.circle_id
      WHERE ccm.id = circle_chat_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their circles" ON public.circle_chat_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.circle_chat_messages ccm
      JOIN public.circle_members cm ON cm.circle_id = ccm.circle_id
      WHERE ccm.id = circle_chat_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON public.circle_chat_reactions
  FOR DELETE USING (auth.uid() = user_id);