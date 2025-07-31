-- Fix SQL type errors in stats functions

-- 1. Fix get_longest_connections: date column is DATE type, not TIMESTAMP
DROP FUNCTION IF EXISTS get_longest_connections(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_longest_connections(user_id_param UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  person_name TEXT,
  date_count BIGINT,
  avg_rating NUMERIC,
  first_date DATE,  -- Changed from TIMESTAMP to DATE
  last_date DATE    -- Changed from TIMESTAMP to DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.person_name,
    COUNT(*) as date_count,
    ROUND(AVG(de.rating), 1) as avg_rating,
    MIN(de.date) as first_date,
    MAX(de.date) as last_date
  FROM date_entries de
  WHERE de.user_id = user_id_param
    AND (de.entry_type = 'date' OR de.entry_type IS NULL)
    AND de.rating > 0
  GROUP BY de.person_name
  ORDER BY date_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_dating_patterns: EXTRACT requires explicit cast
DROP FUNCTION IF EXISTS get_dating_patterns(UUID);

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
  WITH date_data AS (
    SELECT 
      date,
      TO_CHAR(date, 'Day') as day_name,
      -- Default to afternoon if no time specified
      COALESCE(EXTRACT(HOUR FROM date::timestamp), 14) as hour
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
  ),
  day_counts AS (
    SELECT 
      day_name,
      COUNT(*) as day_count
    FROM date_data
    GROUP BY day_name
    ORDER BY day_count DESC
    LIMIT 1
  ),
  time_periods AS (
    SELECT 
      COUNT(*) FILTER (WHERE hour < 12) as morning,
      COUNT(*) FILTER (WHERE hour >= 12 AND hour < 17) as afternoon,
      COUNT(*) FILTER (WHERE hour >= 17) as evening
    FROM date_data
  ),
  date_gaps AS (
    SELECT 
      AVG(gap_days) as avg_gap
    FROM (
      SELECT 
        date - LAG(date) OVER (ORDER BY date) as gap_days
      FROM date_data
    ) gaps
    WHERE gap_days IS NOT NULL
  )
  SELECT 
    COALESCE(dc.day_name, 'N/A'),
    COALESCE(dc.day_count, 0),
    COALESCE(tp.morning, 0),
    COALESCE(tp.afternoon, 0),
    COALESCE(tp.evening, 0),
    ROUND(COALESCE(dg.avg_gap, 0), 1)
  FROM day_counts dc
  CROSS JOIN time_periods tp
  CROSS JOIN date_gaps dg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix get_dating_achievements: Use proper ROUND function with NUMERIC casting
DROP FUNCTION IF EXISTS get_dating_achievements(UUID);

CREATE OR REPLACE FUNCTION get_dating_achievements(user_id_param UUID)
RETURNS TABLE(
  dates_percentile INTEGER,
  rating_percentile INTEGER,
  busiest_week_count INTEGER,
  perfect_dates_count INTEGER,
  favorite_season TEXT,
  momentum_status TEXT,
  achievement_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      user_id,
      COUNT(*) as total_dates,
      AVG(rating) as avg_rating
    FROM date_entries
    WHERE (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
    GROUP BY user_id
  ),
  all_users_stats AS (
    SELECT * FROM user_stats
  ),
  rankings AS (
    SELECT 
      PERCENT_RANK() OVER (ORDER BY total_dates) * 100 as dates_percentile,
      PERCENT_RANK() OVER (ORDER BY avg_rating) * 100 as rating_percentile
    FROM all_users_stats
    WHERE user_id = user_id_param
  ),
  weekly_max AS (
    SELECT MAX(week_count)::INTEGER as max_week
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
    SELECT COUNT(*)::INTEGER as perfect_count
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating = 5
  ),
  seasonal_data AS (
    SELECT 
      CASE 
        WHEN EXTRACT(MONTH FROM date::timestamp) IN (12, 1, 2) THEN 'Winter'
        WHEN EXTRACT(MONTH FROM date::timestamp) IN (3, 4, 5) THEN 'Spring'
        WHEN EXTRACT(MONTH FROM date::timestamp) IN (6, 7, 8) THEN 'Summer'
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
    ROUND(COALESCE(r.dates_percentile, 0))::INTEGER,  -- Cast to INTEGER after rounding
    ROUND(COALESCE(r.rating_percentile, 0))::INTEGER, -- Cast to INTEGER after rounding
    COALESCE(wm.max_week, 0)::INTEGER,
    COALESCE(pd.perfect_count, 0)::INTEGER,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_longest_connections(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_patterns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_achievements(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_longest_connections(UUID, INTEGER) IS 'Returns people with whom the user has had the most dates';
COMMENT ON FUNCTION get_dating_patterns(UUID) IS 'Analyzes dating patterns by day of week and time of day';
COMMENT ON FUNCTION get_dating_achievements(UUID) IS 'Returns user achievements and percentile rankings';