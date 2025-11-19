-- Fix: Profile emails visible to all authenticated users
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users with ver_usuario can view profiles" ON public.profiles;

-- Create restricted policies for profiles table access
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(get_profile_id_from_auth(), 'administrador'::user_role));

-- Ensure profiles_public view has proper access for non-sensitive data
GRANT SELECT ON public.profiles_public TO authenticated;