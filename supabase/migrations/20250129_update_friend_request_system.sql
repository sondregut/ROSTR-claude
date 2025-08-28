-- Update friend request system to require mutual acceptance

-- Update the are_friends function to only return true for active friendships
CREATE OR REPLACE FUNCTION are_friends(p_user_id UUID, p_other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if there's an active mutual friendship
    RETURN EXISTS (
        SELECT 1 FROM friendships f1
        INNER JOIN friendships f2 ON f1.user_id = f2.friend_id AND f1.friend_id = f2.user_id
        WHERE f1.user_id = p_user_id 
        AND f1.friend_id = p_other_user_id 
        AND f1.status = 'active'
        AND f2.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(p_user_id UUID, p_other_user_id UUID)
RETURNS TABLE (
    status TEXT,
    friendship_id UUID,
    direction TEXT
) AS $$
BEGIN
    -- Check for active mutual friendship
    IF EXISTS (
        SELECT 1 FROM friendships f1
        INNER JOIN friendships f2 ON f1.user_id = f2.friend_id AND f1.friend_id = f2.user_id
        WHERE f1.user_id = p_user_id 
        AND f1.friend_id = p_other_user_id 
        AND f1.status = 'active'
        AND f2.status = 'active'
    ) THEN
        RETURN QUERY
        SELECT 'friends'::TEXT, f.id, 'mutual'::TEXT
        FROM friendships f
        WHERE f.user_id = p_user_id AND f.friend_id = p_other_user_id AND f.status = 'active';
        RETURN;
    END IF;
    
    -- Check for pending request sent by user
    RETURN QUERY
    SELECT 'pending_sent'::TEXT, f.id, 'sent'::TEXT
    FROM friendships f
    WHERE f.user_id = p_user_id AND f.friend_id = p_other_user_id AND f.status = 'pending';
    
    IF FOUND THEN RETURN; END IF;
    
    -- Check for pending request received by user
    RETURN QUERY
    SELECT 'pending_received'::TEXT, f.id, 'received'::TEXT
    FROM friendships f
    WHERE f.user_id = p_other_user_id AND f.friend_id = p_user_id AND f.status = 'pending';
    
    IF FOUND THEN RETURN; END IF;
    
    -- No relationship exists
    RETURN QUERY SELECT 'none'::TEXT, NULL::UUID, 'none'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(p_requester_id UUID, p_accepter_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the original request to active
    UPDATE friendships 
    SET status = 'active', updated_at = NOW()
    WHERE user_id = p_requester_id 
    AND friend_id = p_accepter_id 
    AND status = 'pending';
    
    -- Create the reciprocal friendship
    INSERT INTO friendships (user_id, friend_id, status, created_at)
    VALUES (p_accepter_id, p_requester_id, 'active', NOW())
    ON CONFLICT (user_id, friend_id) 
    DO UPDATE SET status = 'active', updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject/cancel a friend request
CREATE OR REPLACE FUNCTION reject_friend_request(p_requester_id UUID, p_target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete the pending request
    DELETE FROM friendships 
    WHERE user_id = p_requester_id 
    AND friend_id = p_target_id 
    AND status = 'pending';
    
    RETURN FOUND;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending friend requests for a user
CREATE OR REPLACE FUNCTION get_pending_friend_requests(p_user_id UUID)
RETURNS TABLE (
    request_id UUID,
    requester_id UUID,
    requester_name TEXT,
    requester_username TEXT,
    requester_image TEXT,
    requested_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.user_id,
        u.name,
        u.username,
        u.image_uri,
        f.created_at
    FROM friendships f
    INNER JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = p_user_id 
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get sent friend requests for a user
CREATE OR REPLACE FUNCTION get_sent_friend_requests(p_user_id UUID)
RETURNS TABLE (
    request_id UUID,
    target_id UUID,
    target_name TEXT,
    target_username TEXT,
    target_image TEXT,
    requested_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.friend_id,
        u.name,
        u.username,
        u.image_uri,
        f.created_at
    FROM friendships f
    INNER JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = p_user_id 
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the search_users_by_username function to include friendship status
CREATE OR REPLACE FUNCTION search_users_by_username(
    search_query TEXT,
    requesting_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    username TEXT,
    image_uri TEXT,
    bio TEXT,
    is_friend BOOLEAN,
    friendship_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.username,
        u.image_uri,
        u.bio,
        -- Check for active mutual friendship
        EXISTS (
            SELECT 1 FROM friendships f1
            INNER JOIN friendships f2 ON f1.user_id = f2.friend_id AND f1.friend_id = f2.user_id
            WHERE f1.user_id = requesting_user_id 
            AND f1.friend_id = u.id 
            AND f1.status = 'active'
            AND f2.status = 'active'
        ) as is_friend,
        -- Get friendship status
        CASE
            WHEN EXISTS (
                SELECT 1 FROM friendships f1
                INNER JOIN friendships f2 ON f1.user_id = f2.friend_id AND f1.friend_id = f2.user_id
                WHERE f1.user_id = requesting_user_id 
                AND f1.friend_id = u.id 
                AND f1.status = 'active'
                AND f2.status = 'active'
            ) THEN 'friends'
            WHEN EXISTS (
                SELECT 1 FROM friendships f
                WHERE f.user_id = requesting_user_id 
                AND f.friend_id = u.id 
                AND f.status = 'pending'
            ) THEN 'pending_sent'
            WHEN EXISTS (
                SELECT 1 FROM friendships f
                WHERE f.user_id = u.id 
                AND f.friend_id = requesting_user_id 
                AND f.status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
        END as friendship_status
    FROM users u
    WHERE (u.username ILIKE '%' || search_query || '%' OR u.name ILIKE '%' || search_query || '%')
    AND u.id != requesting_user_id
    ORDER BY 
        CASE WHEN u.username ILIKE search_query || '%' THEN 1 ELSE 2 END,
        u.name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;