-- Fun and engaging user statistics functions

-- Function to get dating patterns (day of week, time preferences)
CREATE OR REPLACE FUNCTION get_dating_patterns(user_id_param UUID)
RETURNS TABLE(
  most_popular_day TEXT,
  most_popular_day_count BIGINT,
  morning_dates BIGINT,
  afternoon_dates BIGINT,
  evening_dates BIGINT,
  avg_days_between_dates NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_patterns AS (
    SELECT 
      TO_CHAR(date, 'Day') as day_name,
      EXTRACT(hour FROM date) as hour,
      date
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
  ),
  day_counts AS (
    SELECT 
      TRIM(day_name) as day,
      COUNT(*) as count
    FROM date_patterns
    GROUP BY TRIM(day_name)
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  time_counts AS (
    SELECT 
      COUNT(*) FILTER (WHERE hour >= 6 AND hour < 12) as morning,
      COUNT(*) FILTER (WHERE hour >= 12 AND hour < 17) as afternoon,
      COUNT(*) FILTER (WHERE hour >= 17 OR hour < 6) as evening
    FROM date_patterns
  ),
  date_gaps AS (
    SELECT 
      AVG(EXTRACT(EPOCH FROM (lead(date) OVER (ORDER BY date) - date)) / 86400) as avg_gap
    FROM date_patterns
  )
  SELECT 
    COALESCE(dc.day, 'N/A'),
    COALESCE(dc.count, 0),
    COALESCE(tc.morning, 0),
    COALESCE(tc.afternoon, 0),
    COALESCE(tc.evening, 0),
    ROUND(COALESCE(dg.avg_gap, 0), 1)
  FROM day_counts dc
  CROSS JOIN time_counts tc
  CROSS JOIN date_gaps dg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dating streaks
CREATE OR REPLACE FUNCTION get_dating_streaks(user_id_param UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  total_weeks_dated INTEGER,
  consistency_score NUMERIC
) AS $$
DECLARE
  current_streak_count INTEGER := 0;
  longest_streak_count INTEGER := 0;
  last_week INTEGER := NULL;
  current_week INTEGER;
  total_weeks INTEGER := 0;
  weeks_with_dates INTEGER := 0;
BEGIN
  -- Calculate streaks by week
  FOR current_week IN
    SELECT DISTINCT EXTRACT(WEEK FROM date)::INTEGER
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
      AND date >= CURRENT_DATE - INTERVAL '1 year'
    ORDER BY 1 DESC
  LOOP
    IF last_week IS NULL OR last_week - current_week = 1 THEN
      current_streak_count := current_streak_count + 1;
      IF current_streak_count > longest_streak_count THEN
        longest_streak_count := current_streak_count;
      END IF;
    ELSE
      -- Reset current streak if not consecutive
      IF last_week = EXTRACT(WEEK FROM CURRENT_DATE) THEN
        current_streak_count := 1;
      ELSE
        current_streak_count := 0;
      END IF;
    END IF;
    last_week := current_week;
    weeks_with_dates := weeks_with_dates + 1;
  END LOOP;

  -- Calculate total weeks in period
  total_weeks := EXTRACT(WEEK FROM CURRENT_DATE) - EXTRACT(WEEK FROM CURRENT_DATE - INTERVAL '1 year');
  
  RETURN QUERY
  SELECT 
    current_streak_count,
    longest_streak_count,
    weeks_with_dates,
    CASE 
      WHEN total_weeks > 0 THEN ROUND((weeks_with_dates::NUMERIC / total_weeks::NUMERIC) * 100, 1)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get location statistics
CREATE OR REPLACE FUNCTION get_location_stats(user_id_param UUID)
RETURNS TABLE(
  top_location TEXT,
  top_location_count BIGINT,
  top_location_avg_rating NUMERIC,
  unique_locations BIGINT,
  most_successful_location TEXT,
  most_successful_rating NUMERIC,
  location_diversity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH location_data AS (
    SELECT 
      location,
      COUNT(*) as visit_count,
      AVG(rating) as avg_rating
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
      AND location IS NOT NULL
      AND location != ''
    GROUP BY location
  ),
  top_loc AS (
    SELECT location, visit_count, avg_rating
    FROM location_data
    ORDER BY visit_count DESC
    LIMIT 1
  ),
  best_loc AS (
    SELECT location, avg_rating
    FROM location_data
    WHERE visit_count >= 2  -- Only consider locations visited at least twice
    ORDER BY avg_rating DESC
    LIMIT 1
  ),
  diversity AS (
    SELECT 
      COUNT(DISTINCT location) as unique_count,
      COUNT(*) as total_dates
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
      AND location IS NOT NULL
  )
  SELECT 
    COALESCE(tl.location, 'N/A'),
    COALESCE(tl.visit_count, 0),
    ROUND(COALESCE(tl.avg_rating, 0), 1),
    COALESCE(d.unique_count, 0),
    COALESCE(bl.location, 'N/A'),
    ROUND(COALESCE(bl.avg_rating, 0), 1),
    CASE 
      WHEN d.total_dates > 0 THEN ROUND((d.unique_count::NUMERIC / d.total_dates::NUMERIC) * 100, 1)
      ELSE 0
    END
  FROM top_loc tl
  CROSS JOIN best_loc bl
  CROSS JOIN diversity d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine dating personality type
CREATE OR REPLACE FUNCTION get_dating_personality(user_id_param UUID)
RETURNS TABLE(
  personality_type TEXT,
  description TEXT,
  primary_trait TEXT,
  secondary_trait TEXT,
  dating_frequency_score NUMERIC,
  variety_score NUMERIC,
  commitment_score NUMERIC
) AS $$
DECLARE
  freq_score NUMERIC;
  var_score NUMERIC;
  commit_score NUMERIC;
  personality TEXT;
  desc TEXT;
  trait1 TEXT;
  trait2 TEXT;
BEGIN
  -- Calculate frequency score (dates per month)
  SELECT COUNT(*)::NUMERIC / 12 INTO freq_score
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0
    AND date >= CURRENT_DATE - INTERVAL '1 year';

  -- Calculate variety score (unique people / total dates)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(DISTINCT person_name)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END INTO var_score
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0;

  -- Calculate commitment score (average dates per person)
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT person_name) > 0 
      THEN COUNT(*)::NUMERIC / COUNT(DISTINCT person_name)::NUMERIC
      ELSE 0
    END INTO commit_score
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0;

  -- Determine personality type based on scores
  IF freq_score >= 4 AND var_score >= 70 THEN
    personality := 'The Explorer';
    desc := 'You love meeting new people and trying new experiences. Your dating life is an adventure!';
    trait1 := 'Adventurous';
    trait2 := 'Open-minded';
  ELSIF freq_score >= 4 AND commit_score >= 3 THEN
    personality := 'The Romantic';
    desc := 'You date frequently but focus on building deeper connections with select people.';
    trait1 := 'Passionate';
    trait2 := 'Committed';
  ELSIF var_score >= 80 THEN
    personality := 'The Social Butterfly';
    desc := 'You enjoy meeting diverse people and keeping your options open.';
    trait1 := 'Sociable';
    trait2 := 'Curious';
  ELSIF commit_score >= 4 THEN
    personality := 'The Loyalist';
    desc := 'You prefer quality over quantity, investing time in meaningful connections.';
    trait1 := 'Loyal';
    trait2 := 'Thoughtful';
  ELSIF freq_score >= 2 THEN
    personality := 'The Balanced Dater';
    desc := 'You maintain a healthy dating life while balancing other priorities.';
    trait1 := 'Balanced';
    trait2 := 'Selective';
  ELSE
    personality := 'The Quality Seeker';
    desc := 'You''re selective about dating, preferring meaningful connections over frequency.';
    trait1 := 'Discerning';
    trait2 := 'Intentional';
  END IF;

  RETURN QUERY
  SELECT 
    personality,
    desc,
    trait1,
    trait2,
    ROUND(freq_score, 1),
    ROUND(var_score, 1),
    ROUND(commit_score, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get fun comparisons and achievements
CREATE OR REPLACE FUNCTION get_dating_achievements(user_id_param UUID)
RETURNS TABLE(
  total_dates_rank_percentile NUMERIC,
  avg_rating_rank_percentile NUMERIC,
  most_dates_in_week INTEGER,
  perfect_dates_count BIGINT,
  favorite_season TEXT,
  dating_momentum TEXT,
  unique_achievement TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*) as total_dates,
      AVG(rating) as avg_rating
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
  ),
  all_users_stats AS (
    SELECT 
      user_id,
      COUNT(*) as total_dates,
      AVG(rating) as avg_rating
    FROM date_entries
    WHERE (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
    GROUP BY user_id
  ),
  rankings AS (
    SELECT 
      PERCENT_RANK() OVER (ORDER BY total_dates) * 100 as dates_percentile,
      PERCENT_RANK() OVER (ORDER BY avg_rating) * 100 as rating_percentile
    FROM all_users_stats
    WHERE user_id = user_id_param
  ),
  weekly_max AS (
    SELECT MAX(week_count) as max_week
    FROM (
      SELECT COUNT(*) as week_count
      FROM date_entries
      WHERE user_id = user_id_param
        AND (entry_type = 'date' OR entry_type IS NULL)
        AND rating > 0
      GROUP BY DATE_TRUNC('week', date)
    ) weekly_counts
  ),
  perfect_dates AS (
    SELECT COUNT(*) as perfect_count
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating = 5
  ),
  seasonal_data AS (
    SELECT 
      CASE 
        WHEN EXTRACT(MONTH FROM date) IN (12, 1, 2) THEN 'Winter'
        WHEN EXTRACT(MONTH FROM date) IN (3, 4, 5) THEN 'Spring'
        WHEN EXTRACT(MONTH FROM date) IN (6, 7, 8) THEN 'Summer'
        ELSE 'Fall'
      END as season,
      COUNT(*) as count
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
    GROUP BY season
    ORDER BY count DESC
    LIMIT 1
  ),
  recent_trend AS (
    SELECT 
      CASE 
        WHEN COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') > 
             COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '60 days' 
                                AND date < CURRENT_DATE - INTERVAL '30 days') 
        THEN 'Heating up! 🔥'
        WHEN COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') > 0
        THEN 'Steady pace 📊'
        ELSE 'Time to get back out there! 💪'
      END as momentum
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
  )
  SELECT 
    ROUND(COALESCE(r.dates_percentile, 0), 0),
    ROUND(COALESCE(r.rating_percentile, 0), 0),
    COALESCE(wm.max_week, 0),
    COALESCE(pd.perfect_count, 0),
    COALESCE(sd.season, 'N/A'),
    rt.momentum,
    CASE 
      WHEN pd.perfect_count >= 10 THEN 'Perfect 10 Club'
      WHEN wm.max_week >= 5 THEN 'Marathon Week Master'
      WHEN r.rating_percentile >= 90 THEN 'Quality Connoisseur'
      WHEN r.dates_percentile >= 90 THEN 'Social Champion'
      ELSE 'Rising Star'
    END
  FROM rankings r
  CROSS JOIN weekly_max wm
  CROSS JOIN perfect_dates pd
  CROSS JOIN seasonal_data sd
  CROSS JOIN recent_trend rt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dating_patterns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_streaks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_personality(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_achievements(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_dating_patterns(UUID) IS 'Returns dating patterns including preferred days and times';
COMMENT ON FUNCTION get_dating_streaks(UUID) IS 'Calculates current and longest dating streaks';
COMMENT ON FUNCTION get_location_stats(UUID) IS 'Analyzes location preferences and diversity';
COMMENT ON FUNCTION get_dating_personality(UUID) IS 'Determines user dating personality type based on patterns';
COMMENT ON FUNCTION get_dating_achievements(UUID) IS 'Calculates fun achievements and comparisons';