-- Roster deletion options
-- This migration provides different options for handling date entries when deleting roster entries

-- Option 1: Only delete roster addition feed entries (RECOMMENDED)
-- This preserves date history but removes the "added to roster" feed entries
CREATE OR REPLACE FUNCTION delete_roster_additions_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete only roster addition entries for this person by this user
  DELETE FROM date_entries 
  WHERE user_id = OLD.user_id 
    AND person_name = OLD.name
    AND entry_type = 'roster_addition';
    
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Option 2: Delete all related entries (dates and roster additions)
-- This completely removes all traces of the person
CREATE OR REPLACE FUNCTION delete_all_person_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all date entries for this person by this user
  DELETE FROM date_entries 
  WHERE user_id = OLD.user_id 
    AND person_name = OLD.name;
    
  -- Also delete any date plans
  DELETE FROM date_plans
  WHERE user_id = OLD.user_id 
    AND person_name = OLD.name;
    
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Option 3: Soft delete - mark entries as archived
-- This preserves all data but hides it from normal views
CREATE OR REPLACE FUNCTION archive_person_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Add an archived flag to date_entries if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'date_entries' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE date_entries ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Archive all entries for this person
  UPDATE date_entries 
  SET is_archived = TRUE
  WHERE user_id = OLD.user_id 
    AND person_name = OLD.name;
    
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger with Option 1 (recommended) - only delete roster additions
DROP TRIGGER IF EXISTS handle_roster_deletion ON roster_entries;
CREATE TRIGGER handle_roster_deletion
  BEFORE DELETE ON roster_entries
  FOR EACH ROW
  EXECUTE FUNCTION delete_roster_additions_only();

-- Comment on the trigger
COMMENT ON TRIGGER handle_roster_deletion ON roster_entries IS 
  'Deletes roster addition feed entries when a person is removed from roster. Date history is preserved.';

-- To switch to a different option, drop the trigger and recreate with different function:
-- DROP TRIGGER handle_roster_deletion ON roster_entries;
-- CREATE TRIGGER handle_roster_deletion BEFORE DELETE ON roster_entries 
--   FOR EACH ROW EXECUTE FUNCTION delete_all_person_entries();