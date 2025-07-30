-- Add entry_type column
ALTER TABLE date_entries 
ADD COLUMN entry_type VARCHAR(50) DEFAULT 'date';

-- Add roster_info column
ALTER TABLE date_entries 
ADD COLUMN roster_info JSONB;

-- Add check constraint for entry_type
ALTER TABLE date_entries 
ADD CONSTRAINT check_entry_type 
CHECK (entry_type IN ('date', 'roster_addition'));

-- Update existing entries
UPDATE date_entries 
SET entry_type = 'date' 
WHERE entry_type IS NULL;

-- Create index
CREATE INDEX idx_date_entries_entry_type ON date_entries(entry_type);