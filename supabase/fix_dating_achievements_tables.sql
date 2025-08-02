-- Fix get_dating_achievements function to use correct table names
-- The function was looking for tables that don't exist: dates, plans, people
-- Correct tables are: date_entries, date_plans, roster_entries

-- Drop the existing function
DROP FUNCTION IF EXISTS get_dating_achievements(uuid);

-- Recreate with correct table names
CREATE OR REPLACE FUNCTION get_dating_achievements(p_user_id uuid)
RETURNS TABLE (
  total_dates integer,
  unique_people integer,
  total_plans integer,
  avg_rating numeric,
  best_rating integer,
  longest_streak integer,
  current_streak integer,
  most_dates_person text,
  most_dates_count integer
) AS $$
BEGIN
  RETURN QUERY
  WITH date_stats AS (
    SELECT 
      COUNT(*)::integer as total_dates,
      COUNT(DISTINCT person_name)::integer as unique_people,
      AVG(rating)::numeric as avg_rating,
      MAX(rating)::integer as best_rating
    FROM date_entries
    WHERE user_id = p_user_id
  ),
  plan_stats AS (
    SELECT COUNT(*)::integer as total_plans
    FROM date_plans
    WHERE user_id = p_user_id
  ),
  streak_data AS (
    SELECT 
      date,
      date - (ROW_NUMBER() OVER (ORDER BY date))::integer * INTERVAL '1 day' as streak_group
    FROM (
      SELECT DISTINCT DATE(date) as date
      FROM date_entries
      WHERE user_id = p_user_id
      ORDER BY date
    ) as unique_dates
  ),
  streaks AS (
    SELECT 
      streak_group,
      COUNT(*)::integer as streak_length,
      MAX(date) as last_date
    FROM streak_data
    GROUP BY streak_group
  ),
  person_stats AS (
    SELECT 
      person_name as name,
      COUNT(*)::integer as date_count
    FROM date_entries
    WHERE user_id = p_user_id
    GROUP BY person_name
    ORDER BY date_count DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(ds.total_dates, 0)::integer,
    COALESCE(ds.unique_people, 0)::integer,
    COALESCE(ps.total_plans, 0)::integer,
    COALESCE(ds.avg_rating, 0)::numeric,
    COALESCE(ds.best_rating, 0)::integer,
    COALESCE(MAX(s.streak_length), 0)::integer as longest_streak,
    COALESCE(
      CASE 
        WHEN MAX(s.last_date) = CURRENT_DATE OR MAX(s.last_date) = CURRENT_DATE - INTERVAL '1 day'
        THEN MAX(CASE WHEN s.last_date >= CURRENT_DATE - INTERVAL '1 day' THEN s.streak_length ELSE 0 END)
        ELSE 0
      END, 0
    )::integer as current_streak,
    COALESCE(prs.name, '')::text as most_dates_person,
    COALESCE(prs.date_count, 0)::integer as most_dates_count
  FROM date_stats ds
  CROSS JOIN plan_stats ps
  LEFT JOIN streaks s ON true
  LEFT JOIN person_stats prs ON true
  GROUP BY ds.total_dates, ds.unique_people, ps.total_plans, ds.avg_rating, ds.best_rating, prs.name, prs.date_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dating_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_achievements(uuid) TO anon;