-- Fix Error Level Security Issues

-- 1. Fix profile email exposure by creating a public view without email
-- This view can be used by regular users who shouldn't see email addresses
CREATE OR REPLACE VIEW profiles_public AS 
SELECT 
  id,
  name,
  username,
  avatar,
  bio,
  created_at,
  updated_at,
  deleted_at,
  estado,
  confirmed
FROM profiles;

-- Grant access to authenticated users
GRANT SELECT ON profiles_public TO authenticated;

-- Enable RLS on the view (it will inherit from underlying table)
ALTER VIEW profiles_public SET (security_invoker = true);

-- 2. Fix security definer view - Change to SECURITY INVOKER
-- Drop the existing view
DROP VIEW IF EXISTS public_reportes_anonymized;

-- Recreate with SECURITY INVOKER to respect user's RLS policies
CREATE VIEW public_reportes_anonymized 
WITH (security_invoker = true) AS
SELECT 
  id,
  nombre AS titulo,
  descripcion,
  CASE
    WHEN visibility = 'publico'::report_visibility AND geolocation IS NOT NULL 
    THEN ST_SetSRID(
      ST_MakePoint(
        ROUND(ST_X(geolocation::geometry)::numeric, 2)::double precision,
        ROUND(ST_Y(geolocation::geometry)::numeric, 2)::double precision
      ), 4326
    )::geography
    ELSE geolocation
  END AS geolocation,
  CASE
    WHEN visibility = 'publico'::report_visibility 
    THEN 'Área General'::text
    ELSE location::text
  END AS location,
  visibility AS visibilidad,
  tipo_reporte_id,
  user_id AS creador_id,
  assigned_to AS asignado_a,
  status AS estado,
  priority AS prioridad,
  created_at AS fecha_reporte,
  updated_at,
  created_at
FROM reportes
WHERE 
  visibility = 'publico'::report_visibility 
  OR user_id = get_profile_id_from_auth() 
  OR assigned_to = get_profile_id_from_auth() 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.user_id = auth.uid() 
    AND 'administrador'::user_role = ANY(ur.roles)
  );

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public_reportes_anonymized TO authenticated, anon;

-- Add comment documenting the security change
COMMENT ON VIEW public_reportes_anonymized IS 'Anonymized reports view with SECURITY INVOKER - respects querying user RLS policies. Public reports have geolocation rounded to ~1km precision.';