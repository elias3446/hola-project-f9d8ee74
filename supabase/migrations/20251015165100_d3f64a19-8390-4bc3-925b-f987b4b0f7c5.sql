-- Fix inconsistent RLS on user_roles to use profile id instead of auth.uid()
-- Drop existing policies
DROP POLICY IF EXISTS "Users with crear_usuario can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with editar_usuario can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with eliminar_usuario can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with ver_usuario can view roles" ON public.user_roles;

-- Recreate policies using get_profile_id_from_auth()
CREATE POLICY "Users with crear_usuario can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission(public.get_profile_id_from_auth(), 'crear_usuario')
  AND user_id <> public.get_profile_id_from_auth()
);

CREATE POLICY "Users with editar_usuario can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_permission(public.get_profile_id_from_auth(), 'editar_usuario')
  AND user_id <> public.get_profile_id_from_auth()
);

CREATE POLICY "Users with eliminar_usuario can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_permission(public.get_profile_id_from_auth(), 'eliminar_usuario')
  AND user_id <> public.get_profile_id_from_auth()
);

CREATE POLICY "Users with ver_usuario can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_permission(public.get_profile_id_from_auth(), 'ver_usuario')
  OR user_id = public.get_profile_id_from_auth()
);

-- Ensure trigger remains to stamp assigned_by/assigned_at
-- (set_assigned_by() already exists and triggers were created earlier)