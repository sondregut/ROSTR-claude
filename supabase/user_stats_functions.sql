-- Advanced user statistics functions for dating history analytics

-- Function to calculate second date rate
CREATE OR REPLACE FUNCTION calculate_second_date_rate(user_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  first_dates_count INTEGER;
  second_dates_count INTEGER;
  rate NUMERIC;
BEGIN
  -- Count unique people with exactly 1 date
  SELECT COUNT(DISTINCT person_name)
  INTO first_dates_count
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0
  GROUP BY person_name
  HAVING COUNT(*) = 1;

  -- Count unique people with 2 or more dates
  SELECT COUNT(DISTINCT person_name)
  INTO second_dates_count
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0
  GROUP BY person_name
  HAVING COUNT(*) >= 2;

  -- Calculate rate
  IF (first_dates_count + second_dates_count) > 0 THEN
    rate := ROUND((second_dates_count::NUMERIC / (first_dates_count + second_dates_count)::NUMERIC) * 100, 1);
  ELSE
    rate := 0;
  END IF;

  RETURN rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most used tags
CREATE OR REPLACE FUNCTION get_most_used_tags(user_id_param UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(tag TEXT, usage_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(tags) as tag,
    COUNT(*) as usage_count
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND tags IS NOT NULL
    AND array_length(tags, 1) > 0
  GROUP BY unnest(tags)
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get longest connections (people with most dates)
CREATE OR REPLACE FUNCTION get_longest_connections(user_id_param UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  person_name TEXT,
  date_count BIGINT,
  avg_rating NUMERIC,
  first_date TIMESTAMP,
  last_date TIMESTAMP
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
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, AVG(de.rating) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dating trends (dates per month over last 6 months)
CREATE OR REPLACE FUNCTION get_dating_trends(user_id_param UUID)
RETURNS TABLE(
  month_year TEXT,
  date_count BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month_year,
    COUNT(*) as date_count,
    ROUND(AVG(rating), 1) as avg_rating
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0
    AND date >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY date_trunc('month', date)
  ORDER BY date_trunc('month', date) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity metrics (dates this month, last month, etc)
CREATE OR REPLACE FUNCTION get_activity_metrics(user_id_param UUID)
RETURNS TABLE(
  dates_this_month BIGINT,
  dates_last_month BIGINT,
  dates_this_year BIGINT,
  avg_rating_this_month NUMERIC,
  avg_rating_overall NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE)) as dates_this_month,
    COUNT(*) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                      AND date < date_trunc('month', CURRENT_DATE)) as dates_last_month,
    COUNT(*) FILTER (WHERE date >= date_trunc('year', CURRENT_DATE)) as dates_this_year,
    ROUND(AVG(rating) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE)), 1) as avg_rating_this_month,
    ROUND(AVG(rating), 1) as avg_rating_overall
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get rating breakdown by first vs repeat dates
CREATE OR REPLACE FUNCTION get_rating_breakdown(user_id_param UUID)
RETURNS TABLE(
  first_date_avg_rating NUMERIC,
  second_date_avg_rating NUMERIC,
  third_plus_date_avg_rating NUMERIC,
  first_date_count BIGINT,
  second_date_count BIGINT,
  third_plus_date_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_numbers AS (
    SELECT 
      person_name,
      rating,
      ROW_NUMBER() OVER (PARTITION BY person_name ORDER BY date) as date_number
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)
      AND rating > 0
  )
  SELECT 
    ROUND(AVG(rating) FILTER (WHERE date_number = 1), 1) as first_date_avg_rating,
    ROUND(AVG(rating) FILTER (WHERE date_number = 2), 1) as second_date_avg_rating,
    ROUND(AVG(rating) FILTER (WHERE date_number >= 3), 1) as third_plus_date_avg_rating,
    COUNT(*) FILTER (WHERE date_number = 1) as first_date_count,
    COUNT(*) FILTER (WHERE date_number = 2) as second_date_count,
    COUNT(*) FILTER (WHERE date_number >= 3) as third_plus_date_count
  FROM date_numbers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get circles count for user
CREATE OR REPLACE FUNCTION get_user_circles_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  circles_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT circle_id)
  INTO circles_count
  FROM circle_members
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(circles_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive user stats
CREATE OR REPLACE FUNCTION get_comprehensive_user_stats(user_id_param UUID)
RETURNS TABLE(
  total_dates INTEGER,
  active_connections INTEGER,
  avg_rating NUMERIC,
  circles_count INTEGER,
  second_date_rate NUMERIC,
  dates_this_month BIGINT,
  dates_last_month BIGINT,
  most_active_month TEXT,
  favorite_activity TEXT
) AS $$
DECLARE
  activity_metrics RECORD;
  most_active RECORD;
  top_tag RECORD;
BEGIN
  -- Get basic stats
  SELECT * INTO activity_metrics FROM get_activity_metrics(user_id_param);
  
  -- Get most active month
  SELECT month_year, date_count 
  INTO most_active
  FROM get_dating_trends(user_id_param)
  ORDER BY date_count DESC
  LIMIT 1;
  
  -- Get top tag
  SELECT tag 
  INTO top_tag
  FROM get_most_used_tags(user_id_param, 1);
  
  RETURN QUERY
  SELECT 
    u.total_dates,
    u.active_connections,
    u.avg_rating,
    get_user_circles_count(user_id_param),
    calculate_second_date_rate(user_id_param),
    activity_metrics.dates_this_month,
    activity_metrics.dates_last_month,
    COALESCE(most_active.month_year, 'N/A'),
    COALESCE(top_tag.tag, 'N/A')
  FROM users u
  WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_second_date_rate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_used_tags(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_longest_connections(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_trends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rating_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_circles_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_user_stats(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_second_date_rate(UUID) IS 'Calculates the percentage of people who went on a second date';
COMMENT ON FUNCTION get_most_used_tags(UUID, INTEGER) IS 'Returns the most frequently used tags in date entries';
COMMENT ON FUNCTION get_longest_connections(UUID, INTEGER) IS 'Returns people with whom the user has had the most dates';
COMMENT ON FUNCTION get_dating_trends(UUID) IS 'Returns monthly dating activity for the last 6 months';
COMMENT ON FUNCTION get_activity_metrics(UUID) IS 'Returns current and recent dating activity metrics';
COMMENT ON FUNCTION get_rating_breakdown(UUID) IS 'Returns average ratings broken down by date number';
COMMENT ON FUNCTION get_comprehensive_user_stats(UUID) IS 'Returns all key user statistics in one call';