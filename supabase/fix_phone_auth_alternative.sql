-- Alternative fix: Update trigger to handle phone authentication
-- Only use this if you prefer to keep the database trigger approach

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create updated function that handles phone auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists (to prevent duplicates)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Insert with proper null handling for email and phone
  INSERT INTO public.users (
    id, 
    email, 
    phone,
    name, 
    username
  )
  VALUES (
    NEW.id, 
    NEW.email, -- Can be null for phone auth
    NEW.phone, -- Can be null for email auth
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name',
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      'user_' || substr(NEW.id::text, 1, 8)
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN others THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();