-- Solución: Eliminar TODAS las políticas recursivas de profiles y crear políticas super simples

-- 1. Eliminar TODAS las políticas que causan recursión en profiles
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_with_edit_permission_update_profiles" ON public.profiles;

-- 2. Crear funciones SECURITY DEFINER que NO consulten profiles (evitan recursión completa)
CREATE OR REPLACE FUNCTION public.auth_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Primero obtener el profile.id desde auth.uid() SIN pasar por RLS
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (
      -- Esta subconsulta se ejecuta con SECURITY DEFINER, evita RLS
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
    AND 'administrador' = ANY(ur.roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_has_permission(required_permission user_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
    AND required_permission = ANY(ur.permisos)
  );
$$;

-- 3. Crear políticas MUY SIMPLES sin recursión
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT
  TO public
  USING (public.auth_user_is_admin());

CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE
  TO public
  USING (public.auth_user_is_admin());

CREATE POLICY "users_with_edit_permission_update_profiles" ON public.profiles
  FOR UPDATE
  TO public
  USING (
    user_id = auth.uid() OR 
    public.auth_user_has_permission('editar_usuario'::user_permission)
  );