-- Create Circle Chat Tables
-- Run this BEFORE circle_chat_schema.sql

-- Circle chat messages table
CREATE TABLE IF NOT EXISTS public.circle_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle chat members table (for read receipts and member status)
CREATE TABLE IF NOT EXISTS public.circle_chat_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_typing BOOLEAN DEFAULT FALSE,
  typing_updated_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Circle chat reactions table
CREATE TABLE IF NOT EXISTS public.circle_chat_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.circle_chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX idx_circle_chat_messages_circle_id ON public.circle_chat_messages(circle_id);
CREATE INDEX idx_circle_chat_messages_sender_id ON public.circle_chat_messages(sender_id);
CREATE INDEX idx_circle_chat_messages_created_at ON public.circle_chat_messages(circle_id, created_at DESC);

CREATE INDEX idx_circle_chat_members_circle_id ON public.circle_chat_members(circle_id);
CREATE INDEX idx_circle_chat_members_user_id ON public.circle_chat_members(user_id);

CREATE INDEX idx_circle_chat_reactions_message_id ON public.circle_chat_reactions(message_id);

-- Function to automatically add user to circle_chat_members when they join a circle
CREATE OR REPLACE FUNCTION add_user_to_circle_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.circle_chat_members (circle_id, user_id)
  VALUES (NEW.circle_id, NEW.user_id)
  ON CONFLICT (circle_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add users to chat when they join circles
CREATE TRIGGER add_circle_member_to_chat
AFTER INSERT ON public.circle_members
FOR EACH ROW
EXECUTE FUNCTION add_user_to_circle_chat();

-- Function to remove user from circle_chat_members when they leave a circle
CREATE OR REPLACE FUNCTION remove_user_from_circle_chat()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.circle_chat_members
  WHERE circle_id = OLD.circle_id AND user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to remove users from chat when they leave circles
CREATE TRIGGER remove_circle_member_from_chat
AFTER DELETE ON public.circle_members
FOR EACH ROW
EXECUTE FUNCTION remove_user_from_circle_chat();