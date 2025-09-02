-- Add friend request notification types to notifications table
-- This migration adds 'friend_request' and 'friend_request_accepted' to the allowed notification types

-- Drop the existing check constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT notifications_type_check;

-- Add the new constraint with friend request types included
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
  'friend_request',
  'friend_request_accepted',
  'circle_invite',
  'circle_activity',
  'message',
  'circle_message',
  'reminder',
  'achievement',
  'system'
));