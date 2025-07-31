-- Fix date counting to only count actual logged dates
-- This excludes roster additions and planned dates

-- Create a function to calculate actual date count for a user
CREATE OR REPLACE FUNCTION calculate_user_date_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM date_entries
    WHERE user_id = user_id_param
      AND (entry_type = 'date' OR entry_type IS NULL)  -- Only count actual dates
      AND rating > 0  -- Only count entries with ratings (actual dates have ratings)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  date_count INTEGER;
  avg_rating_value NUMERIC;
  active_count INTEGER;
BEGIN
  -- Calculate total dates (excluding roster additions and plans)
  date_count := calculate_user_date_count(user_id_param);
  
  -- Calculate average rating from actual dates only
  SELECT COALESCE(AVG(rating), 0)
  INTO avg_rating_value
  FROM date_entries
  WHERE user_id = user_id_param
    AND (entry_type = 'date' OR entry_type IS NULL)
    AND rating > 0;
  
  -- Calculate active connections from roster
  SELECT COUNT(*)
  INTO active_count
  FROM roster_entries
  WHERE user_id = user_id_param
    AND status IN ('active', 'new', 'fading');
  
  -- Update user stats
  UPDATE users
  SET 
    total_dates = date_count,
    avg_rating = ROUND(avg_rating_value, 1),
    active_connections = active_count,
    updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to update stats when dates are added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT and UPDATE, use NEW record
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Only update stats if this is an actual date entry
    IF (NEW.entry_type = 'date' OR NEW.entry_type IS NULL) AND NEW.rating > 0 THEN
      PERFORM update_user_stats(NEW.user_id);
    END IF;
    RETURN NEW;
  END IF;
  
  -- For DELETE, use OLD record
  IF TG_OP = 'DELETE' THEN
    -- Only update stats if this was an actual date entry
    IF (OLD.entry_type = 'date' OR OLD.entry_type IS NULL) AND OLD.rating > 0 THEN
      PERFORM update_user_stats(OLD.user_id);
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_stats_on_date_change ON date_entries;

-- Create trigger for date entries
CREATE TRIGGER update_user_stats_on_date_change
  AFTER INSERT OR UPDATE OR DELETE ON date_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- Also update stats when roster entries change (for active connections count)
CREATE OR REPLACE FUNCTION trigger_update_user_stats_roster()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM update_user_stats(NEW.user_id);
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM update_user_stats(OLD.user_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_stats_on_roster_change ON roster_entries;

-- Create trigger for roster entries
CREATE TRIGGER update_user_stats_on_roster_change
  AFTER INSERT OR UPDATE OR DELETE ON roster_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats_roster();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_user_date_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_stats(UUID) TO authenticated;

-- Fix existing user stats by recalculating them
-- This will update all users' stats to reflect only actual dates
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users
  LOOP
    PERFORM update_user_stats(user_record.id);
  END LOOP;
END;
$$;

-- Add a comment to document the change
COMMENT ON FUNCTION calculate_user_date_count(UUID) IS 'Calculates the total number of actual dates for a user, excluding roster additions and planned dates';
COMMENT ON FUNCTION update_user_stats(UUID) IS 'Updates user statistics including total dates, average rating, and active connections';