-- Add phone discovery fields to users table if they don't exist
DO $$ 
BEGIN
    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add allow_phone_discovery column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'allow_phone_discovery'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN allow_phone_discovery BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Create an index on phone for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Create an index for users who allow phone discovery
CREATE INDEX IF NOT EXISTS idx_users_phone_discovery 
ON public.users(phone) 
WHERE phone IS NOT NULL AND allow_phone_discovery = TRUE;

-- Add comment to explain the fields
COMMENT ON COLUMN public.users.phone IS 'User phone number in E.164 format for contact discovery';
COMMENT ON COLUMN public.users.phone_verified IS 'Whether the phone number has been verified';
COMMENT ON COLUMN public.users.allow_phone_discovery IS 'Whether the user allows friends to discover them via phone number';