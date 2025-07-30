-- Add support for roster additions in the feed
-- This migration adds columns to the date_entries table to support roster addition feed entries

-- Add entry_type column to distinguish between date entries and roster additions
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS entry_type VARCHAR(50) DEFAULT 'date' CHECK (entry_type IN ('date', 'roster_addition'));

-- Add roster_info column to store roster-specific information
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS roster_info JSONB;

-- Update existing entries to have the default entry_type
UPDATE date_entries 
SET entry_type = 'date' 
WHERE entry_type IS NULL;

-- Create an index on entry_type for better query performance
CREATE INDEX IF NOT EXISTS idx_date_entries_entry_type ON date_entries(entry_type);

-- Add a comment to document the roster_info structure
COMMENT ON COLUMN date_entries.roster_info IS 'JSON object containing roster-specific information: {"age": number, "occupation": string, "how_we_met": string, "interests": string, "instagram": string, "phone": string, "photos": array}';

-- Add a comment to document the entry_type column
COMMENT ON COLUMN date_entries.entry_type IS 'Type of feed entry: date (normal date entry) or roster_addition (someone added to roster)';