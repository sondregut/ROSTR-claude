-- Manual Chat Setup SQL
-- Execute this in Supabase SQL Editor to fix chat functionality

-- 1. Add circle_id columns to messages table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE;
    
    ALTER TABLE public.messages
    ADD COLUMN sender_name TEXT,
    ADD COLUMN sender_avatar TEXT;
    
    CREATE INDEX idx_messages_circle_id ON public.messages(circle_id);
    CREATE INDEX idx_messages_circle_created ON public.messages(circle_id, created_at DESC);
  END IF;
END $$;

-- 2. Create typing indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_circle_user ON public.typing_indicators(circle_id, user_id);

-- 3. Create circle message reads table
CREATE TABLE IF NOT EXISTS public.circle_message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_reads ON public.circle_message_reads(circle_id, user_id);

-- 4. Enable RLS on new tables
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_message_reads ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Circle members can view typing indicators" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can view and update their read status" ON public.circle_message_reads;
DROP POLICY IF EXISTS "Circle members can view others' read status" ON public.circle_message_reads;
DROP POLICY IF EXISTS "Circle members can view circle messages" ON public.messages;
DROP POLICY IF EXISTS "Circle members can send messages" ON public.messages;

-- 6. Create RLS policies for typing indicators
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

-- 7. Create RLS policies for message reads
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

-- 8. Create RLS policies for circle messages
CREATE POLICY "Circle members can view circle messages" ON public.messages
  FOR SELECT USING (
    circle_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = messages.circle_id
        AND cm.user_id = auth.uid()
    )
  );

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

-- 9. Create helper function for unread count
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

GRANT EXECUTE ON FUNCTION get_circle_unread_count TO authenticated;

-- 10. Enable realtime (must be done via Supabase dashboard)
-- Go to Database > Replication and enable for:
-- - messages table
-- - typing_indicators table

-- 11. Create a test user for development (optional)
-- This will help with testing if you don't have auth set up yet
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test@rostrdating.com',
  crypt('testpassword', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding user profile
INSERT INTO public.users (id, email, name, username)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test@rostrdating.com',
  'Test User',
  'testuser'
) ON CONFLICT (id) DO NOTHING;

-- Create test circle
INSERT INTO public.circles (id, name, description, owner_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Test Circle',
  'Test circle for chat functionality',
  '550e8400-e29b-41d4-a716-446655440000'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Add user to test circle
INSERT INTO public.circle_members (circle_id, user_id, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'owner'
) ON CONFLICT (circle_id, user_id) DO NOTHING;