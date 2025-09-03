-- Add country code support for phone numbers
-- This migration adds a country_code field to store the user's country preference

-- Add country_code column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

-- Add comment to explain the field
COMMENT ON COLUMN public.users.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, FR) for the user''s phone number';

-- Create an index for country code statistics
CREATE INDEX IF NOT EXISTS idx_users_country_code ON public.users(country_code) WHERE country_code IS NOT NULL;

-- Update existing US phone numbers to have country_code = 'US'
-- This assumes existing +1 numbers are US numbers
UPDATE public.users 
SET country_code = 'US' 
WHERE phone IS NOT NULL 
  AND phone LIKE '+1%'
  AND country_code IS NULL;

-- Function to extract country code from E.164 phone number
CREATE OR REPLACE FUNCTION extract_country_from_phone(phone_number TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Common country codes by prefix
    -- This is a simplified version - in production, use application logic with libphonenumber
    IF phone_number LIKE '+1%' THEN
        -- Could be US or CA, default to US
        RETURN 'US';
    ELSIF phone_number LIKE '+44%' THEN
        RETURN 'GB';
    ELSIF phone_number LIKE '+33%' THEN
        RETURN 'FR';
    ELSIF phone_number LIKE '+49%' THEN
        RETURN 'DE';
    ELSIF phone_number LIKE '+47%' THEN
        RETURN 'NO';
    ELSIF phone_number LIKE '+46%' THEN
        RETURN 'SE';
    ELSIF phone_number LIKE '+45%' THEN
        RETURN 'DK';
    ELSIF phone_number LIKE '+31%' THEN
        RETURN 'NL';
    ELSIF phone_number LIKE '+41%' THEN
        RETURN 'CH';
    ELSIF phone_number LIKE '+43%' THEN
        RETURN 'AT';
    ELSIF phone_number LIKE '+32%' THEN
        RETURN 'BE';
    ELSIF phone_number LIKE '+39%' THEN
        RETURN 'IT';
    ELSIF phone_number LIKE '+34%' THEN
        RETURN 'ES';
    ELSIF phone_number LIKE '+351%' THEN
        RETURN 'PT';
    ELSIF phone_number LIKE '+48%' THEN
        RETURN 'PL';
    ELSIF phone_number LIKE '+420%' THEN
        RETURN 'CZ';
    ELSIF phone_number LIKE '+36%' THEN
        RETURN 'HU';
    ELSIF phone_number LIKE '+358%' THEN
        RETURN 'FI';
    ELSIF phone_number LIKE '+372%' THEN
        RETURN 'EE';
    ELSIF phone_number LIKE '+371%' THEN
        RETURN 'LV';
    ELSIF phone_number LIKE '+370%' THEN
        RETURN 'LT';
    ELSIF phone_number LIKE '+353%' THEN
        RETURN 'IE';
    ELSIF phone_number LIKE '+354%' THEN
        RETURN 'IS';
    ELSIF phone_number LIKE '+81%' THEN
        RETURN 'JP';
    ELSIF phone_number LIKE '+82%' THEN
        RETURN 'KR';
    ELSIF phone_number LIKE '+86%' THEN
        RETURN 'CN';
    ELSIF phone_number LIKE '+91%' THEN
        RETURN 'IN';
    ELSIF phone_number LIKE '+61%' THEN
        RETURN 'AU';
    ELSIF phone_number LIKE '+64%' THEN
        RETURN 'NZ';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Attempt to populate country_code for existing phone numbers
UPDATE public.users 
SET country_code = extract_country_from_phone(phone)
WHERE phone IS NOT NULL 
  AND country_code IS NULL;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION extract_country_from_phone TO authenticated;