-- Create friendships table for managing friend relationships
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique friendship per direction
    UNIQUE(user_id, friend_id),
    -- Prevent self-friendship
    CONSTRAINT different_users CHECK (user_id != friend_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own friendships" ON public.friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create their own friendships" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships" ON public.friendships
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships" ON public.friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Function to get mutual friends
CREATE OR REPLACE FUNCTION get_mutual_friends(p_user_id UUID, p_other_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    friend_name TEXT,
    friend_username TEXT,
    friend_image TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        u.id,
        u.name,
        u.username,
        u.image_uri
    FROM friendships f1
    INNER JOIN friendships f2 ON f1.friend_id = f2.friend_id
    INNER JOIN users u ON u.id = f1.friend_id
    WHERE f1.user_id = p_user_id 
    AND f2.user_id = p_other_user_id
    AND f1.status = 'active'
    AND f2.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(p_user_id UUID, p_other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM friendships 
        WHERE user_id = p_user_id 
        AND friend_id = p_other_user_id 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql;