-- Circle Chat Database Schema Updates
-- Execute this in Supabase SQL Editor after the main schema

-- Add circle_id to messages table to support group chats
ALTER TABLE public.messages 
ADD COLUMN circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE;

-- Add sender metadata to messages for easier querying
ALTER TABLE public.messages
ADD COLUMN sender_name TEXT,
ADD COLUMN sender_avatar TEXT;

-- Create index for circle messages
CREATE INDEX IF NOT EXISTS idx_messages_circle_id ON public.messages(circle_id);

-- Create composite index for efficient circle message queries
CREATE INDEX IF NOT EXISTS idx_messages_circle_created ON public.messages(circle_id, created_at DESC);

-- Update conversations table to support both 1-on-1 and circle chats
ALTER TABLE public.conversations
ADD COLUMN conversation_type TEXT DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'circle')),
ADD COLUMN circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE;

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Create index for typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_circle_user ON public.typing_indicators(circle_id, user_id);

-- Function to update circle last activity when message is sent
CREATE OR REPLACE FUNCTION update_circle_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.circle_id IS NOT NULL THEN
    UPDATE public.circles 
    SET updated_at = NEW.created_at
    WHERE id = NEW.circle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for circle activity updates
DROP TRIGGER IF EXISTS update_circle_activity_trigger ON public.messages;
CREATE TRIGGER update_circle_activity_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW 
  WHEN (NEW.circle_id IS NOT NULL)
  EXECUTE PROCEDURE update_circle_last_activity();

-- Function to clean up old typing indicators (older than 5 seconds)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  UPDATE public.typing_indicators
  SET is_typing = FALSE
  WHERE is_typing = TRUE 
    AND last_typed_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create message read tracking for circle messages
CREATE TABLE IF NOT EXISTS public.circle_message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Create index for read tracking
CREATE INDEX IF NOT EXISTS idx_circle_reads ON public.circle_message_reads(circle_id, user_id);

-- RLS Policies for circle messages
-- Allow circle members to view circle messages
CREATE POLICY "Circle members can view circle messages" ON public.messages
  FOR SELECT USING (
    circle_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = messages.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Allow circle members to send messages to their circles
CREATE POLICY "Circle members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    circle_id IS NOT NULL AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = messages.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS for typing indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view typing indicators" ON public.typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = typing_indicators.circle_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing status" ON public.typing_indicators
  FOR ALL USING (user_id = auth.uid());

-- RLS for message reads
ALTER TABLE public.circle_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their read status" ON public.circle_message_reads
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Circle members can view others' read status" ON public.circle_message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_message_reads.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Function to get unread message count for a user in a circle
CREATE OR REPLACE FUNCTION get_circle_unread_count(p_circle_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_read_id UUID;
  v_count INTEGER;
BEGIN
  -- Get the last read message ID
  SELECT last_read_message_id INTO v_last_read_id
  FROM public.circle_message_reads
  WHERE circle_id = p_circle_id AND user_id = p_user_id;

  -- Count messages after the last read
  IF v_last_read_id IS NULL THEN
    -- User hasn't read any messages, count all
    SELECT COUNT(*) INTO v_count
    FROM public.messages
    WHERE circle_id = p_circle_id
      AND sender_id != p_user_id;
  ELSE
    -- Count messages after last read
    SELECT COUNT(*) INTO v_count
    FROM public.messages m1
    WHERE m1.circle_id = p_circle_id
      AND m1.sender_id != p_user_id
      AND m1.created_at > (
        SELECT created_at FROM public.messages
        WHERE id = v_last_read_id
      );
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_circle_unread_count TO authenticated;

-- Create a view for circle conversations with metadata
CREATE OR REPLACE VIEW circle_conversations_view AS
SELECT 
  c.id AS circle_id,
  c.name AS circle_name,
  c.description,
  c.member_count,
  c.owner_id,
  c.updated_at AS last_activity,
  (
    SELECT json_build_object(
      'id', m.id,
      'content', m.content,
      'sender_id', m.sender_id,
      'sender_name', m.sender_name,
      'created_at', m.created_at
    )
    FROM public.messages m
    WHERE m.circle_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message
FROM public.circles c
WHERE c.is_active = TRUE;

-- Grant select on view to authenticated users
GRANT SELECT ON circle_conversations_view TO authenticated;