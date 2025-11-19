-- Fix RLS policies on reporte_historial table to use profile IDs correctly

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all historial" ON public.reporte_historial;
DROP POLICY IF EXISTS "Admins can update historial" ON public.reporte_historial;
DROP POLICY IF EXISTS "Users can view their own historial" ON public.reporte_historial;

-- Recreate policies with correct profile_id usage
CREATE POLICY "Admins can view all historial"
ON public.reporte_historial
FOR SELECT
USING (
  has_role(get_profile_id_from_auth(), 'administrador'::user_role)
);

CREATE POLICY "Admins can update historial"
ON public.reporte_historial
FOR UPDATE
USING (
  has_role(get_profile_id_from_auth(), 'administrador'::user_role)
);

CREATE POLICY "Users can view their own historial"
ON public.reporte_historial
FOR SELECT
USING (
  get_profile_id_from_auth() = assigned_by OR
  get_profile_id_from_auth() = assigned_from OR
  get_profile_id_from_auth() = assigned_to
);