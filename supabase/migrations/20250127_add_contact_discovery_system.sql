-- Add phone number support to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_phone_discovery BOOLEAN DEFAULT true;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Table to track contact sync operations
CREATE TABLE IF NOT EXISTS public.contact_syncs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contact_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    sync_hash TEXT, -- Hash of contact list to detect changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_contact_syncs_user_id ON public.contact_syncs(user_id);

-- Table for storing hashed phone numbers from contacts
CREATE TABLE IF NOT EXISTS public.contact_phone_hashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_hash TEXT NOT NULL, -- SHA256 hash of normalized phone number
    contact_name TEXT, -- Name as stored in user's contacts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, phone_hash)
);

-- Indexes for efficient matching
CREATE INDEX IF NOT EXISTS idx_contact_phone_hashes_user_id ON public.contact_phone_hashes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_phone_hashes_phone_hash ON public.contact_phone_hashes(phone_hash);

-- Table for bidirectional contact matches
CREATE TABLE IF NOT EXISTS public.contact_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_type VARCHAR(20) DEFAULT 'phone' CHECK (match_type IN ('phone', 'email')),
    match_strength INTEGER DEFAULT 1, -- 1 = one-way, 2 = bidirectional
    is_mutual BOOLEAN DEFAULT false, -- True if both users have each other's contact
    auto_friended BOOLEAN DEFAULT false, -- True if friendship was auto-created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, matched_user_id),
    CONSTRAINT different_users CHECK (user_id != matched_user_id)
);

-- Indexes for contact matches
CREATE INDEX IF NOT EXISTS idx_contact_matches_user_id ON public.contact_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_matches_matched_user_id ON public.contact_matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_matches_mutual ON public.contact_matches(is_mutual) WHERE is_mutual = true;

-- Function to find bidirectional contact matches
CREATE OR REPLACE FUNCTION find_contact_matches(p_user_id UUID)
RETURNS TABLE (
    matched_user_id UUID,
    matched_user_name TEXT,
    matched_user_username TEXT,
    matched_user_image TEXT,
    is_friend BOOLEAN,
    is_mutual_contact BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH user_phone AS (
        -- Get the user's phone number
        SELECT phone, phone_hash
        FROM users u
        LEFT JOIN LATERAL (
            SELECT encode(digest(u.phone, 'sha256'), 'hex') as phone_hash
        ) ph ON true
        WHERE u.id = p_user_id AND u.phone IS NOT NULL
    ),
    potential_matches AS (
        -- Find users who have this user's phone in their contacts
        SELECT DISTINCT cph.user_id as matcher_id
        FROM contact_phone_hashes cph
        INNER JOIN user_phone up ON cph.phone_hash = up.phone_hash
        WHERE cph.user_id != p_user_id
    ),
    mutual_checks AS (
        -- Check if this user also has them in contacts
        SELECT 
            pm.matcher_id,
            EXISTS (
                SELECT 1 
                FROM contact_phone_hashes cph2
                INNER JOIN users u2 ON u2.id = pm.matcher_id
                WHERE cph2.user_id = p_user_id 
                AND cph2.phone_hash = encode(digest(u2.phone, 'sha256'), 'hex')
            ) as is_mutual
        FROM potential_matches pm
    )
    SELECT 
        u.id,
        u.name,
        u.username,
        u.image_uri,
        EXISTS (
            SELECT 1 FROM friendships f 
            WHERE f.user_id = p_user_id AND f.friend_id = u.id
        ) as is_friend,
        mc.is_mutual
    FROM mutual_checks mc
    INNER JOIN users u ON u.id = mc.matcher_id
    WHERE u.allow_phone_discovery = true
    ORDER BY mc.is_mutual DESC, u.name;
END;
$$ LANGUAGE plpgsql;

-- Function to sync contact matches after upload
CREATE OR REPLACE FUNCTION sync_contact_matches(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_phone_hash TEXT;
    v_match RECORD;
BEGIN
    -- Get user's phone hash
    SELECT encode(digest(phone, 'sha256'), 'hex') INTO v_user_phone_hash
    FROM users 
    WHERE id = p_user_id AND phone IS NOT NULL;
    
    IF v_user_phone_hash IS NULL THEN
        RETURN;
    END IF;
    
    -- Find all potential matches
    FOR v_match IN 
        SELECT DISTINCT cph.user_id as matcher_id
        FROM contact_phone_hashes cph
        WHERE cph.phone_hash = v_user_phone_hash
        AND cph.user_id != p_user_id
    LOOP
        -- Check if reverse match exists
        IF EXISTS (
            SELECT 1 
            FROM contact_phone_hashes cph2
            INNER JOIN users u ON u.id = v_match.matcher_id
            WHERE cph2.user_id = p_user_id 
            AND cph2.phone_hash = encode(digest(u.phone, 'sha256'), 'hex')
        ) THEN
            -- Bidirectional match found
            INSERT INTO contact_matches (user_id, matched_user_id, is_mutual, match_strength)
            VALUES (p_user_id, v_match.matcher_id, true, 2)
            ON CONFLICT (user_id, matched_user_id) 
            DO UPDATE SET 
                is_mutual = true, 
                match_strength = 2,
                updated_at = NOW();
                
            -- Also create reverse match
            INSERT INTO contact_matches (user_id, matched_user_id, is_mutual, match_strength)
            VALUES (v_match.matcher_id, p_user_id, true, 2)
            ON CONFLICT (user_id, matched_user_id) 
            DO UPDATE SET 
                is_mutual = true, 
                match_strength = 2,
                updated_at = NOW();
        ELSE
            -- One-way match
            INSERT INTO contact_matches (user_id, matched_user_id, is_mutual, match_strength)
            VALUES (v_match.matcher_id, p_user_id, false, 1)
            ON CONFLICT (user_id, matched_user_id) 
            DO UPDATE SET 
                updated_at = NOW();
        END IF;
    END LOOP;
    
    -- Update sync record
    UPDATE contact_syncs
    SET 
        matched_count = (
            SELECT COUNT(*) FROM contact_matches 
            WHERE user_id = p_user_id
        ),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.contact_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync records" ON public.contact_syncs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync records" ON public.contact_syncs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync records" ON public.contact_syncs
    FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.contact_phone_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact hashes" ON public.contact_phone_hashes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own contact hashes" ON public.contact_phone_hashes
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.contact_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their matches" ON public.contact_matches
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "System can create matches" ON public.contact_matches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update matches" ON public.contact_matches
    FOR UPDATE USING (true);