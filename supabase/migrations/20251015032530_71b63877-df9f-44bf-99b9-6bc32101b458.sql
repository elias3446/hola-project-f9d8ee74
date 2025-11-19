-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users with ver_usuario can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users with editar_usuario can update profiles" ON public.profiles;

-- Create security definer function to get profile_id from auth.uid()
-- This bypasses RLS policies to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_profile_id_from_auth()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Create corrected policies using the security definer function
CREATE POLICY "Users with ver_usuario can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_permission(
    public.get_profile_id_from_auth(), 
    'ver_usuario'::user_permission
  ) 
  OR (user_id = auth.uid())
);

CREATE POLICY "Users with editar_usuario can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_permission(
    public.get_profile_id_from_auth(), 
    'editar_usuario'::user_permission
  ) 
  OR (user_id = auth.uid())
);