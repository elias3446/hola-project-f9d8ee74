-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users with ver_usuario can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users with editar_usuario can update profiles" ON public.profiles;

-- Create corrected policies that properly convert auth.uid() to profile.id
CREATE POLICY "Users with ver_usuario can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_permission(
    (SELECT id FROM profiles WHERE user_id = auth.uid()), 
    'ver_usuario'::user_permission
  ) 
  OR (user_id = auth.uid())
);

CREATE POLICY "Users with editar_usuario can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_permission(
    (SELECT id FROM profiles WHERE user_id = auth.uid()), 
    'editar_usuario'::user_permission
  ) 
  OR (user_id = auth.uid())
);