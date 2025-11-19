-- Fix inconsistent RLS policies on public.reportes to use profile id instead of auth.uid()
-- Enable RLS just in case
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (they currently use auth.uid())
DROP POLICY IF EXISTS "Users with crear_reporte can create reportes" ON public.reportes;
DROP POLICY IF EXISTS "Users with editar_reporte can update reportes" ON public.reportes;
DROP POLICY IF EXISTS "Users with eliminar_reporte can delete reportes" ON public.reportes;
DROP POLICY IF EXISTS "Users with ver_reporte can view reportes" ON public.reportes;

-- Recreate policies using get_profile_id_from_auth() so they match user_roles.user_id (profiles.id)
CREATE POLICY "Users with crear_reporte can create reportes"
ON public.reportes
FOR INSERT
TO authenticated
WITH CHECK (
  has_permission(get_profile_id_from_auth(), 'crear_reporte'::user_permission)
  AND get_profile_id_from_auth() = user_id
);

CREATE POLICY "Users with editar_reporte can update reportes"
ON public.reportes
FOR UPDATE
TO authenticated
USING (
  has_permission(get_profile_id_from_auth(), 'editar_reporte'::user_permission)
  OR get_profile_id_from_auth() = user_id
  OR get_profile_id_from_auth() = assigned_to
)
WITH CHECK (
  has_permission(get_profile_id_from_auth(), 'editar_reporte'::user_permission)
  OR get_profile_id_from_auth() = user_id
  OR get_profile_id_from_auth() = assigned_to
);

CREATE POLICY "Users with eliminar_reporte can delete reportes"
ON public.reportes
FOR DELETE
TO authenticated
USING (
  has_permission(get_profile_id_from_auth(), 'eliminar_reporte'::user_permission)
  OR get_profile_id_from_auth() = user_id
);

CREATE POLICY "Users with ver_reporte can view reportes"
ON public.reportes
FOR SELECT
TO authenticated
USING (
  has_permission(get_profile_id_from_auth(), 'ver_reporte'::user_permission)
  OR visibility = 'publico'::report_visibility
  OR get_profile_id_from_auth() = user_id
  OR get_profile_id_from_auth() = assigned_to
);
