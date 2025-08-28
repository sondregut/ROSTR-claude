-- Add message notification types to notifications table
-- This migration adds 'message' and 'circle_message' to the allowed notification types

-- Drop the existing check constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT notifications_type_check;

-- Add the new constraint with message types included
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'like',
  'reaction',
  'comment',
  'mention',
  'poll_vote',
  'friend_date',
  'friend_roster',
  'friend_plan',
  'circle_invite',
  'circle_activity',
  'message',
  'circle_message',
  'reminder',
  'achievement',
  'system'
));