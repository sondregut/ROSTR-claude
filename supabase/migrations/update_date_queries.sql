-- Updated queries to fetch dates with reactions instead of likes
-- These are example queries your app should use to get reaction data

-- Example query to get date entries with reactions for a user
-- This replaces the old query that used date_likes
CREATE OR REPLACE FUNCTION get_dates_with_reactions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    person_name TEXT,
    location TEXT,
    date TIMESTAMPTZ,
    rating INTEGER,
    notes TEXT,
    tags TEXT[],
    shared_circles UUID[],
    is_private BOOLEAN,
    image_uri TEXT,
    entry_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    like_count BIGINT,
    comment_count BIGINT,
    reactions JSONB,
    user_reaction reaction_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.user_id,
        de.person_name,
        de.location,
        de.date,
        de.rating,
        de.notes,
        de.tags,
        de.shared_circles,
        de.is_private,
        de.image_uri,
        de.entry_type,
        de.created_at,
        de.updated_at,
        -- Total reaction count (replaces like_count)
        COALESCE(COUNT(DISTINCT dr.id), 0) as like_count,
        -- Comment count remains the same
        de.comment_count,
        -- Aggregate reactions by type
        COALESCE(
            jsonb_object_agg(
                dr_summary.reaction_type::text,
                jsonb_build_object(
                    'count', dr_summary.count,
                    'users', dr_summary.user_ids
                )
            ) FILTER (WHERE dr_summary.reaction_type IS NOT NULL),
            '{}'::jsonb
        ) as reactions,
        -- Current user's reaction
        user_reaction.reaction_type as user_reaction
    FROM date_entries de
    LEFT JOIN date_reactions dr ON de.id = dr.date_entry_id
    LEFT JOIN date_reactions_summary dr_summary ON de.id = dr_summary.date_entry_id
    LEFT JOIN date_reactions user_reaction ON de.id = user_reaction.date_entry_id AND user_reaction.user_id = p_user_id
    GROUP BY 
        de.id, 
        de.user_id,
        de.person_name,
        de.location,
        de.date,
        de.rating,
        de.notes,
        de.tags,
        de.shared_circles,
        de.is_private,
        de.image_uri,
        de.entry_type,
        de.created_at,
        de.updated_at,
        de.comment_count,
        user_reaction.reaction_type;
END;
$$ LANGUAGE plpgsql;

-- Example query to get plans with reactions
CREATE OR REPLACE FUNCTION get_plans_with_reactions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    person_name TEXT,
    date DATE,
    time TIME,
    location TEXT,
    notes TEXT,
    tags TEXT[],
    is_completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    like_count BIGINT,
    comment_count BIGINT,
    reactions JSONB,
    user_reaction reaction_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id,
        dp.user_id,
        dp.person_name,
        dp.date,
        dp.time,
        dp.location,
        dp.notes,
        dp.tags,
        dp.is_completed,
        dp.created_at,
        dp.updated_at,
        -- Total reaction count
        COALESCE(COUNT(DISTINCT pr.id), 0) as like_count,
        -- Comment count
        COALESCE(COUNT(DISTINCT pc.id), 0) as comment_count,
        -- Aggregate reactions
        COALESCE(
            jsonb_object_agg(
                pr_summary.reaction_type::text,
                jsonb_build_object(
                    'count', pr_summary.count,
                    'users', pr_summary.user_ids
                )
            ) FILTER (WHERE pr_summary.reaction_type IS NOT NULL),
            '{}'::jsonb
        ) as reactions,
        -- Current user's reaction
        user_reaction.reaction_type as user_reaction
    FROM date_plans dp
    LEFT JOIN plan_reactions pr ON dp.id = pr.plan_id
    LEFT JOIN plan_reactions_summary pr_summary ON dp.id = pr_summary.plan_id
    LEFT JOIN plan_reactions user_reaction ON dp.id = user_reaction.plan_id AND user_reaction.user_id = p_user_id
    LEFT JOIN plan_comments pc ON dp.id = pc.plan_id
    GROUP BY 
        dp.id,
        dp.user_id,
        dp.person_name,
        dp.date,
        dp.time,
        dp.location,
        dp.notes,
        dp.tags,
        dp.is_completed,
        dp.created_at,
        dp.updated_at,
        user_reaction.reaction_type;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dates_with_reactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plans_with_reactions(UUID) TO authenticated;