-- Add person details columns to roster_entries table
ALTER TABLE public.roster_entries
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS how_we_met VARCHAR(255),
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[]; -- Array of photo URLs

-- Add check constraint for age if provided
ALTER TABLE public.roster_entries
DROP CONSTRAINT IF EXISTS check_age;

ALTER TABLE public.roster_entries
ADD CONSTRAINT check_age CHECK (age IS NULL OR age >= 18);

-- Create index on instagram for quick lookups
CREATE INDEX IF NOT EXISTS idx_roster_entries_instagram ON public.roster_entries(instagram);