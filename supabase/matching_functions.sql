-- Matching Algorithm Functions for RostrDating
-- Execute this in Supabase SQL Editor after schema.sql

-- Function to calculate compatibility score between two users
CREATE OR REPLACE FUNCTION calculate_compatibility_score(user1_id UUID, user2_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  user1_record RECORD;
  user2_record RECORD;
  score DECIMAL(3,2) := 0.0;
  age_diff INTEGER;
  shared_interests INTEGER;
  total_interests INTEGER;
  location_match BOOLEAN := FALSE;
BEGIN
  -- Get user records
  SELECT * INTO user1_record FROM public.users WHERE id = user1_id;
  SELECT * INTO user2_record FROM public.users WHERE id = user2_id;
  
  -- Check if users exist and are active
  IF user1_record IS NULL OR user2_record IS NULL OR 
     NOT user1_record.is_active OR NOT user2_record.is_active THEN
    RETURN 0.0;
  END IF;
  
  -- Age compatibility (max 20 points)
  IF user1_record.age IS NOT NULL AND user2_record.age IS NOT NULL THEN
    age_diff := ABS(user1_record.age - user2_record.age);
    CASE 
      WHEN age_diff <= 2 THEN score := score + 0.20;
      WHEN age_diff <= 5 THEN score := score + 0.15;
      WHEN age_diff <= 10 THEN score := score + 0.10;
      WHEN age_diff <= 15 THEN score := score + 0.05;
      ELSE score := score + 0.0;
    END CASE;
  END IF;
  
  -- Location compatibility (max 15 points)
  IF user1_record.location IS NOT NULL AND user2_record.location IS NOT NULL THEN
    location_match := user1_record.location = user2_record.location;
    IF location_match THEN
      score := score + 0.15;
    ELSE
      score := score + 0.05; -- Different locations get small bonus
    END IF;
  END IF;
  
  -- Shared interests (max 25 points)
  IF array_length(user1_record.interests, 1) > 0 AND array_length(user2_record.interests, 1) > 0 THEN
    SELECT COUNT(*) INTO shared_interests
    FROM unnest(user1_record.interests) AS interest
    WHERE interest = ANY(user2_record.interests);
    
    total_interests := array_length(user1_record.interests, 1) + array_length(user2_record.interests, 1);
    
    IF total_interests > 0 THEN
      score := score + (shared_interests::DECIMAL / (total_interests::DECIMAL / 2.0)) * 0.25;
    END IF;
  END IF;
  
  -- Shared circles bonus (max 20 points)
  IF users_share_circle(user1_id, user2_id) THEN
    score := score + 0.20;
  END IF;
  
  -- Activity level compatibility (max 10 points)
  -- Users who are recently active get bonus
  IF user1_record.last_seen > NOW() - INTERVAL '7 days' AND 
     user2_record.last_seen > NOW() - INTERVAL '7 days' THEN
    score := score + 0.10;
  ELSIF user1_record.last_seen > NOW() - INTERVAL '30 days' AND 
        user2_record.last_seen > NOW() - INTERVAL '30 days' THEN
    score := score + 0.05;
  END IF;
  
  -- Dating experience compatibility (max 10 points)
  IF user1_record.total_dates > 0 AND user2_record.total_dates > 0 THEN
    -- Users with similar dating experience
    IF ABS(user1_record.total_dates - user2_record.total_dates) <= 5 THEN
      score := score + 0.10;
    ELSIF ABS(user1_record.total_dates - user2_record.total_dates) <= 10 THEN
      score := score + 0.05;
    END IF;
  END IF;
  
  -- Ensure score doesn't exceed 1.0
  IF score > 1.0 THEN
    score := 1.0;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get potential matches for a user
CREATE OR REPLACE FUNCTION get_potential_matches(
  target_user_id UUID,
  limit_count INTEGER DEFAULT 20,
  min_score DECIMAL DEFAULT 0.1
)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  username TEXT,
  age INTEGER,
  location TEXT,
  image_uri TEXT,
  compatibility_score DECIMAL,
  shared_circles INTEGER,
  shared_interests TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.username,
    u.age,
    u.location,
    u.image_uri,
    calculate_compatibility_score(target_user_id, u.id) as compatibility_score,
    get_shared_circle_count(target_user_id, u.id) as shared_circles,
    get_shared_interests(target_user_id, u.id) as shared_interests
  FROM public.users u
  WHERE u.id != target_user_id
    AND u.is_active = true
    AND u.last_seen > NOW() - INTERVAL '90 days' -- Active within 90 days
    AND NOT EXISTS (
      -- Exclude users already matched or rejected
      SELECT 1 FROM public.matches m 
      WHERE (m.user_1 = target_user_id AND m.user_2 = u.id)
         OR (m.user_1 = u.id AND m.user_2 = target_user_id)
    )
    AND calculate_compatibility_score(target_user_id, u.id) >= min_score
  ORDER BY compatibility_score DESC, u.last_seen DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared circle count between users
CREATE OR REPLACE FUNCTION get_shared_circle_count(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
DECLARE
  shared_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shared_count
  FROM public.circle_members cm1
  JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
  WHERE cm1.user_id = user1_id AND cm2.user_id = user2_id;
  
  RETURN COALESCE(shared_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared interests between users
CREATE OR REPLACE FUNCTION get_shared_interests(user1_id UUID, user2_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  user1_interests TEXT[];
  user2_interests TEXT[];
  shared_interests TEXT[];
BEGIN
  SELECT interests INTO user1_interests FROM public.users WHERE id = user1_id;
  SELECT interests INTO user2_interests FROM public.users WHERE id = user2_id;
  
  IF user1_interests IS NULL OR user2_interests IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT ARRAY_AGG(interest) INTO shared_interests
  FROM unnest(user1_interests) AS interest
  WHERE interest = ANY(user2_interests);
  
  RETURN COALESCE(shared_interests, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a match
CREATE OR REPLACE FUNCTION create_or_update_match(
  user1_id UUID,
  user2_id UUID,
  user1_status match_status
)
RETURNS TABLE(
  match_id UUID,
  is_mutual_match BOOLEAN,
  created_new BOOLEAN
) AS $$
DECLARE
  existing_match RECORD;
  match_record RECORD;
  ordered_user1 UUID;
  ordered_user2 UUID;
  is_new BOOLEAN := FALSE;
  is_mutual BOOLEAN := FALSE;
BEGIN
  -- Ensure consistent ordering
  IF user1_id < user2_id THEN
    ordered_user1 := user1_id;
    ordered_user2 := user2_id;
  ELSE
    ordered_user1 := user2_id;
    ordered_user2 := user1_id;
  END IF;
  
  -- Check if match already exists
  SELECT * INTO existing_match
  FROM public.matches
  WHERE user_1 = ordered_user1 AND user_2 = ordered_user2;
  
  IF existing_match IS NULL THEN
    -- Create new match
    INSERT INTO public.matches (user_1, user_2, user_1_status, user_2_status)
    VALUES (
      ordered_user1, 
      ordered_user2,
      CASE WHEN user1_id = ordered_user1 THEN user1_status ELSE 'pending' END,
      CASE WHEN user1_id = ordered_user2 THEN user1_status ELSE 'pending' END
    )
    RETURNING * INTO match_record;
    
    is_new := TRUE;
  ELSE
    -- Update existing match
    UPDATE public.matches
    SET
      user_1_status = CASE 
        WHEN user1_id = ordered_user1 THEN user1_status 
        ELSE user_1_status 
      END,
      user_2_status = CASE 
        WHEN user1_id = ordered_user2 THEN user1_status 
        ELSE user_2_status 
      END,
      matched_at = CASE 
        WHEN (
          (user1_id = ordered_user1 AND user1_status = 'matched' AND user_2_status = 'matched') OR
          (user1_id = ordered_user2 AND user1_status = 'matched' AND user_1_status = 'matched')
        ) THEN NOW() 
        ELSE matched_at 
      END,
      updated_at = NOW()
    WHERE user_1 = ordered_user1 AND user_2 = ordered_user2
    RETURNING * INTO match_record;
  END IF;
  
  -- Check if it's a mutual match
  is_mutual := match_record.user_1_status = 'matched' AND match_record.user_2_status = 'matched';
  
  RETURN QUERY SELECT match_record.id, is_mutual, is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's matches
CREATE OR REPLACE FUNCTION get_user_matches(
  target_user_id UUID,
  match_status_filter match_status DEFAULT NULL
)
RETURNS TABLE(
  match_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_username TEXT,
  other_user_image TEXT,
  match_status match_status,
  matched_at TIMESTAMP WITH TIME ZONE,
  compatibility_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE 
      WHEN m.user_1 = target_user_id THEN m.user_2 
      ELSE m.user_1 
    END as other_user_id,
    u.name as other_user_name,
    u.username as other_user_username,
    u.image_uri as other_user_image,
    CASE 
      WHEN m.user_1 = target_user_id THEN m.user_1_status 
      ELSE m.user_2_status 
    END as match_status,
    m.matched_at,
    calculate_compatibility_score(target_user_id, 
      CASE WHEN m.user_1 = target_user_id THEN m.user_2 ELSE m.user_1 END
    ) as compatibility_score
  FROM public.matches m
  JOIN public.users u ON u.id = CASE 
    WHEN m.user_1 = target_user_id THEN m.user_2 
    ELSE m.user_1 
  END
  WHERE (m.user_1 = target_user_id OR m.user_2 = target_user_id)
    AND u.is_active = true
    AND (match_status_filter IS NULL OR 
         (m.user_1 = target_user_id AND m.user_1_status = match_status_filter) OR
         (m.user_2 = target_user_id AND m.user_2_status = match_status_filter))
  ORDER BY 
    CASE WHEN m.matched_at IS NOT NULL THEN m.matched_at ELSE m.created_at END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dating recommendations based on date history
CREATE OR REPLACE FUNCTION get_date_recommendations(
  target_user_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  recommended_user_id UUID,
  recommendation_reason TEXT,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  -- Recommend users who went on dates with people the target user also dated
  WITH user_date_partners AS (
    SELECT DISTINCT person_name, rating
    FROM public.date_entries 
    WHERE user_id = target_user_id AND rating >= 4
  ),
  similar_users AS (
    SELECT 
      de.user_id,
      COUNT(*) as shared_partners,
      AVG(de.rating) as avg_rating
    FROM public.date_entries de
    JOIN user_date_partners udp ON de.person_name = udp.person_name
    WHERE de.user_id != target_user_id 
      AND de.rating >= 4
    GROUP BY de.user_id
    HAVING COUNT(*) >= 2 -- At least 2 shared partners
  )
  SELECT 
    su.user_id,
    'You both had great dates with similar people' as recommendation_reason,
    LEAST(su.shared_partners::DECIMAL / 10.0, 1.0) as confidence_score
  FROM similar_users su
  JOIN public.users u ON u.id = su.user_id
  WHERE u.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE (m.user_1 = target_user_id AND m.user_2 = su.user_id)
         OR (m.user_1 = su.user_id AND m.user_2 = target_user_id)
    )
  ORDER BY confidence_score DESC, su.avg_rating DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user compatibility scores (run periodically)
CREATE OR REPLACE FUNCTION refresh_user_compatibility()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- This could be used to pre-calculate and cache compatibility scores
  -- For now, we calculate them on-demand
  
  FOR user_record IN SELECT id FROM public.users WHERE is_active = true LOOP
    -- Update user's last activity metrics
    UPDATE public.users 
    SET 
      total_dates = (
        SELECT COUNT(*) FROM public.date_entries 
        WHERE user_id = user_record.id
      ),
      avg_rating = (
        SELECT AVG(rating) FROM public.date_entries 
        WHERE user_id = user_record.id
      ),
      updated_at = NOW()
    WHERE id = user_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending interests (for recommendation improvements)
CREATE OR REPLACE FUNCTION get_trending_interests(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  interest TEXT,
  user_count INTEGER,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(u.interests) as interest,
    COUNT(DISTINCT u.id)::INTEGER as user_count,
    AVG(de.rating) as avg_rating
  FROM public.users u
  JOIN public.date_entries de ON de.user_id = u.id
  WHERE u.is_active = true
    AND de.created_at > NOW() - (days_back || ' days')::INTERVAL
    AND array_length(u.interests, 1) > 0
  GROUP BY unnest(u.interests)
  HAVING COUNT(DISTINCT u.id) >= 5 -- At least 5 users
  ORDER BY user_count DESC, avg_rating DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get location-based recommendations
CREATE OR REPLACE FUNCTION get_location_matches(
  target_user_id UUID,
  radius_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  username TEXT,
  location TEXT,
  distance_km INTEGER,
  compatibility_score DECIMAL
) AS $$
DECLARE
  target_location TEXT;
BEGIN
  -- Get target user's location
  SELECT location INTO target_location FROM public.users WHERE id = target_user_id;
  
  IF target_location IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.username,
    u.location,
    0 as distance_km, -- Placeholder - would need geolocation data for real distance
    calculate_compatibility_score(target_user_id, u.id) as compatibility_score
  FROM public.users u
  WHERE u.id != target_user_id
    AND u.is_active = true
    AND u.location IS NOT NULL
    AND u.location = target_location -- Simple string match - could be improved with geolocation
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE (m.user_1 = target_user_id AND m.user_2 = u.id)
         OR (m.user_1 = u.id AND m.user_2 = target_user_id)
    )
  ORDER BY compatibility_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;