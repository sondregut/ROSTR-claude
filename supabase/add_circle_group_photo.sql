-- Add group photo support to circles
-- This migration adds a group_photo_url column to the circles table

-- Add group_photo_url column to circles table
ALTER TABLE circles 
ADD COLUMN IF NOT EXISTS group_photo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN circles.group_photo_url IS 'URL to the circle group photo stored in Supabase storage';