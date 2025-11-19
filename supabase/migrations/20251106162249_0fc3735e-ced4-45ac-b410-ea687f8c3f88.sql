-- Arreglar recursión infinita en políticas RLS de profiles
-- El problema es que get_profile_id_from_auth() consulta profiles, 
-- causando recursión cuando se usa en las políticas de profiles

-- Primero, eliminar las políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users with editar_usuario can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;

-- Crear políticas simples sin recursión
-- Los administradores pueden ver todos los perfiles
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (
        SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
      )
      AND 'administrador' = ANY(user_roles.roles)
    )
  );

-- Los administradores pueden actualizar perfiles
CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (
        SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
      )
      AND 'administrador' = ANY(user_roles.roles)
    )
  );

-- Usuarios con permiso editar_usuario pueden actualizar perfiles (además de su propio perfil)
CREATE POLICY "users_with_edit_permission_update_profiles" ON public.profiles
  FOR UPDATE
  TO public
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (
        SELECT id FROM public.profiles WHERE profiles.user_id = auth.uid()
      )
      AND 'editar_usuario' = ANY(user_roles.permisos)
    )
  );