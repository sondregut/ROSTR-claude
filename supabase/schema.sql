-- RostrDating Database Schema
-- Execute this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE message_type AS ENUM ('text', 'image', 'location');
CREATE TYPE match_status AS ENUM ('pending', 'matched', 'rejected');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  age INTEGER,
  gender user_gender,
  date_of_birth DATE,
  image_uri TEXT DEFAULT '',
  instagram_username TEXT DEFAULT '',
  total_dates INTEGER DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  interests TEXT[] DEFAULT '{}',
  dating_preferences JSONB DEFAULT '{}',
  lifestyle_preferences JSONB DEFAULT '{}',
  deal_breakers TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circles table (friend groups)
CREATE TABLE public.circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT FALSE,
  join_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle memberships (many-to-many relationship)
CREATE TABLE public.circle_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Date entries table
CREATE TABLE public.date_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  date DATE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  shared_circles UUID[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE,
  image_uri TEXT DEFAULT '',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (for chat)
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_1 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 != participant_2)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table (for dating matching system)
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_1 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_2 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_1_status match_status DEFAULT 'pending',
  user_2_status match_status DEFAULT 'pending',
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_1, user_2),
  CHECK (user_1 != user_2)
);

-- Likes table (for date entries)
CREATE TABLE public.date_entry_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_entry_id, user_id)
);

-- Comments table (for date entries)
CREATE TABLE public.date_entry_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User photos table (multiple photos per user)
CREATE TABLE public.user_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (for reporting inappropriate content/users)
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reported_date_entry_id UUID REFERENCES public.date_entries(id) ON DELETE CASCADE,
  reported_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (reported_user_id IS NOT NULL AND reported_date_entry_id IS NULL AND reported_message_id IS NULL) OR
    (reported_user_id IS NULL AND reported_date_entry_id IS NOT NULL AND reported_message_id IS NULL) OR
    (reported_user_id IS NULL AND reported_date_entry_id IS NULL AND reported_message_id IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_location ON public.users(location);
CREATE INDEX idx_users_age ON public.users(age);
CREATE INDEX idx_users_last_seen ON public.users(last_seen);
CREATE INDEX idx_users_is_active ON public.users(is_active);

CREATE INDEX idx_circles_owner_id ON public.circles(owner_id);
CREATE INDEX idx_circles_is_active ON public.circles(is_active);
CREATE INDEX idx_circles_join_code ON public.circles(join_code);

CREATE INDEX idx_circle_members_circle_id ON public.circle_members(circle_id);
CREATE INDEX idx_circle_members_user_id ON public.circle_members(user_id);

CREATE INDEX idx_date_entries_user_id ON public.date_entries(user_id);
CREATE INDEX idx_date_entries_date ON public.date_entries(date);
CREATE INDEX idx_date_entries_is_private ON public.date_entries(is_private);
CREATE INDEX idx_date_entries_rating ON public.date_entries(rating);

CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);

CREATE INDEX idx_matches_user_1 ON public.matches(user_1);
CREATE INDEX idx_matches_user_2 ON public.matches(user_2);
CREATE INDEX idx_matches_matched_at ON public.matches(matched_at);

CREATE INDEX idx_date_entry_likes_date_entry_id ON public.date_entry_likes(date_entry_id);
CREATE INDEX idx_date_entry_likes_user_id ON public.date_entry_likes(user_id);

CREATE INDEX idx_date_entry_comments_date_entry_id ON public.date_entry_comments(date_entry_id);
CREATE INDEX idx_date_entry_comments_user_id ON public.date_entry_comments(user_id);

CREATE INDEX idx_user_photos_user_id ON public.user_photos(user_id);
CREATE INDEX idx_user_photos_is_primary ON public.user_photos(is_primary);

CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_circles BEFORE UPDATE ON public.circles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_date_entries BEFORE UPDATE ON public.date_entries FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_messages BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_matches BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_comments BEFORE UPDATE ON public.date_entry_comments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_reports BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Function to update circle member count
CREATE OR REPLACE FUNCTION update_circle_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles 
    SET member_count = (
      SELECT COUNT(*) FROM public.circle_members 
      WHERE circle_id = NEW.circle_id
    )
    WHERE id = NEW.circle_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles 
    SET member_count = (
      SELECT COUNT(*) FROM public.circle_members 
      WHERE circle_id = OLD.circle_id
    )
    WHERE id = OLD.circle_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for circle member count
CREATE TRIGGER update_circle_member_count_trigger
  AFTER INSERT OR DELETE ON public.circle_members
  FOR EACH ROW EXECUTE PROCEDURE update_circle_member_count();

-- Function to update date entry counters
CREATE OR REPLACE FUNCTION update_date_entry_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'date_entry_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.date_entries 
      SET like_count = like_count + 1
      WHERE id = NEW.date_entry_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.date_entries 
      SET like_count = like_count - 1
      WHERE id = OLD.date_entry_id;
      RETURN OLD;
    END IF;
  ELSIF TG_TABLE_NAME = 'date_entry_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.date_entries 
      SET comment_count = comment_count + 1
      WHERE id = NEW.date_entry_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.date_entries 
      SET comment_count = comment_count - 1
      WHERE id = OLD.date_entry_id;
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for date entry counters
CREATE TRIGGER update_like_count_trigger
  AFTER INSERT OR DELETE ON public.date_entry_likes
  FOR EACH ROW EXECUTE PROCEDURE update_date_entry_counters();

CREATE TRIGGER update_comment_count_trigger
  AFTER INSERT OR DELETE ON public.date_entry_comments
  FOR EACH ROW EXECUTE PROCEDURE update_date_entry_counters();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update last message in conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation last message
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE update_conversation_last_message();