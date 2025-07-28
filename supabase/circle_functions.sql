-- Functions for managing circle member counts

-- Function to increment circle member count
CREATE OR REPLACE FUNCTION increment_circle_member_count(circle_id UUID, increment_by INT DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE circles 
  SET member_count = member_count + increment_by
  WHERE id = circle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement circle member count
CREATE OR REPLACE FUNCTION decrement_circle_member_count(circle_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE circles 
  SET member_count = GREATEST(0, member_count - 1)
  WHERE id = circle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update member count on insert
CREATE OR REPLACE FUNCTION update_circle_member_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circles 
  SET member_count = member_count + 1
  WHERE id = NEW.circle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER circle_member_insert_trigger
AFTER INSERT ON circle_members
FOR EACH ROW
EXECUTE FUNCTION update_circle_member_count_on_insert();

-- Trigger to automatically update member count on delete
CREATE OR REPLACE FUNCTION update_circle_member_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circles 
  SET member_count = GREATEST(0, member_count - 1)
  WHERE id = OLD.circle_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER circle_member_delete_trigger
AFTER DELETE ON circle_members
FOR EACH ROW
EXECUTE FUNCTION update_circle_member_count_on_delete();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_circle_member_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_circle_member_count TO authenticated;