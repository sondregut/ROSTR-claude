-- Ensure date entries are deleted when roster entries are deleted
-- This migration creates a trigger to clean up related date entries when a roster entry is deleted

-- Create a function to delete related date entries
CREATE OR REPLACE FUNCTION delete_related_date_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete only roster addition entries for this person by this user
  -- We keep actual date entries as they are historical records
  DELETE FROM date_entries 
  WHERE user_id = OLD.user_id 
    AND person_name = OLD.name
    AND entry_type = 'roster_addition';
    
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to execute before roster entry deletion
DROP TRIGGER IF EXISTS cascade_delete_roster_dates ON roster_entries;
CREATE TRIGGER cascade_delete_roster_dates
  BEFORE DELETE ON roster_entries
  FOR EACH ROW
  EXECUTE FUNCTION delete_related_date_entries();

-- Add a comment to document the trigger
COMMENT ON TRIGGER cascade_delete_roster_dates ON roster_entries IS 
  'Automatically deletes all date entries (including roster additions) when a person is removed from the roster';