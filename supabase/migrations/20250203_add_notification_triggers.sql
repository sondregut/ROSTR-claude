-- Add automatic notification triggers for likes and comments
-- This migration creates triggers that automatically generate notifications when users interact with dates

-- Function to create notification for date likes
CREATE OR REPLACE FUNCTION notify_date_like()
RETURNS TRIGGER AS $$
DECLARE
  date_owner_id UUID;
  liker_name TEXT;
  date_person_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  user_prefs RECORD;
BEGIN
  -- Get the date owner and person name
  SELECT user_id, person_name 
  INTO date_owner_id, date_person_name
  FROM date_entries 
  WHERE id = NEW.date_entry_id;
  
  -- Don't notify if user liked their own date
  IF date_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the liker's name
  SELECT name INTO liker_name
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Check user's notification preferences
  SELECT likes_reactions, push_enabled
  INTO user_prefs
  FROM notification_preferences
  WHERE user_id = date_owner_id;
  
  -- Only create notification if user has enabled likes notifications
  IF user_prefs.push_enabled AND user_prefs.likes_reactions THEN
    -- Create notification title and body
    notification_title := 'New Like';
    notification_body := liker_name || ' liked your date with ' || date_person_name;
    
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      body,
      data,
      read
    ) VALUES (
      date_owner_id,
      'like',
      notification_title,
      notification_body,
      jsonb_build_object(
        'dateId', NEW.date_entry_id,
        'likerId', NEW.user_id,
        'likerName', liker_name,
        'personName', date_person_name
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for date comments
CREATE OR REPLACE FUNCTION notify_date_comment()
RETURNS TRIGGER AS $$
DECLARE
  date_owner_id UUID;
  commenter_name TEXT;
  date_person_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  user_prefs RECORD;
  comment_preview TEXT;
BEGIN
  -- Get the date owner and person name
  SELECT user_id, person_name 
  INTO date_owner_id, date_person_name
  FROM date_entries 
  WHERE id = NEW.date_entry_id;
  
  -- Don't notify if user commented on their own date
  IF date_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the commenter's name
  SELECT name INTO commenter_name
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Check user's notification preferences
  SELECT comments, push_enabled
  INTO user_prefs
  FROM notification_preferences
  WHERE user_id = date_owner_id;
  
  -- Only create notification if user has enabled comment notifications
  IF user_prefs.push_enabled AND user_prefs.comments THEN
    -- Create comment preview (first 50 chars)
    comment_preview := CASE 
      WHEN length(NEW.content) > 50 
      THEN substring(NEW.content from 1 for 47) || '...'
      ELSE NEW.content
    END;
    
    -- Create notification title and body
    notification_title := 'New Comment';
    notification_body := commenter_name || ' commented on your date with ' || date_person_name || ': "' || comment_preview || '"';
    
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      body,
      data,
      read
    ) VALUES (
      date_owner_id,
      'comment',
      notification_title,
      notification_body,
      jsonb_build_object(
        'dateId', NEW.date_entry_id,
        'commentId', NEW.id,
        'commenterId', NEW.user_id,
        'commenterName', commenter_name,
        'personName', date_person_name,
        'comment', NEW.content
      ),
      false
    );
  END IF;
  
  -- Also notify mentioned users if any (future enhancement)
  -- Parse @mentions in comment and create notifications for them
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle unlike (delete like notification if unread)
CREATE OR REPLACE FUNCTION remove_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  date_owner_id UUID;
BEGIN
  -- Get the date owner
  SELECT user_id INTO date_owner_id
  FROM date_entries 
  WHERE id = OLD.date_entry_id;
  
  -- Remove unread like notification if it exists
  DELETE FROM notifications
  WHERE user_id = date_owner_id
    AND type = 'like'
    AND read = false
    AND (data->>'dateId')::UUID = OLD.date_entry_id
    AND (data->>'likerId')::UUID = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_on_date_like ON date_likes;
DROP TRIGGER IF EXISTS notify_on_date_comment ON date_comments;
DROP TRIGGER IF EXISTS remove_notification_on_unlike ON date_likes;

-- Create triggers for likes
CREATE TRIGGER notify_on_date_like
  AFTER INSERT ON date_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_date_like();

-- Create trigger for removing like notifications
CREATE TRIGGER remove_notification_on_unlike
  AFTER DELETE ON date_likes
  FOR EACH ROW
  EXECUTE FUNCTION remove_like_notification();

-- Create triggers for comments
CREATE TRIGGER notify_on_date_comment
  AFTER INSERT ON date_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_date_comment();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_date_like() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_date_comment() TO authenticated;
GRANT EXECUTE ON FUNCTION remove_like_notification() TO authenticated;

-- Create default notification preferences for existing users who don't have them
INSERT INTO notification_preferences (
  user_id,
  push_enabled,
  email_enabled,
  likes_reactions,
  comments,
  mentions,
  friend_activity,
  circle_updates,
  reminders,
  achievements,
  sound_enabled,
  vibration_enabled
)
SELECT 
  id,
  true,  -- push_enabled
  false, -- email_enabled
  true,  -- likes_reactions
  true,  -- comments
  true,  -- mentions
  true,  -- friend_activity
  true,  -- circle_updates
  true,  -- reminders
  true,  -- achievements
  true,  -- sound_enabled
  true   -- vibration_enabled
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np
  WHERE np.user_id = u.id
);

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_data_dateid ON notifications((data->>'dateId'));
CREATE INDEX IF NOT EXISTS idx_notifications_data_likerid ON notifications((data->>'likerId'));

COMMENT ON FUNCTION notify_date_like() IS 'Creates a notification when someone likes a date entry';
COMMENT ON FUNCTION notify_date_comment() IS 'Creates a notification when someone comments on a date entry';
COMMENT ON FUNCTION remove_like_notification() IS 'Removes unread like notification when a like is removed';