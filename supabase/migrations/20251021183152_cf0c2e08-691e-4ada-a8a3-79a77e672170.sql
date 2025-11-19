-- Add explicit INSERT policy to profiles table
-- This prevents direct profile creation and ensures only the system trigger can create profiles
CREATE POLICY "Only system trigger can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Add comment for documentation
COMMENT ON POLICY "Only system trigger can create profiles" ON public.profiles 
IS 'Profiles are created automatically via the handle_new_user() trigger when users sign up. Direct INSERT is disabled for security.';