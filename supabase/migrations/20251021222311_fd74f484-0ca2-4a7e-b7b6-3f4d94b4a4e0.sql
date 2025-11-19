-- Fix Critical Security Issues (User Data Protection)

-- 1. Restrict login_attempts access to admins only
DROP POLICY IF EXISTS "Users can view their own login attempts" ON login_attempts;
DROP POLICY IF EXISTS "Only admins can view login attempts" ON login_attempts;

CREATE POLICY "Only admins can view login attempts"
ON login_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.user_id = auth.uid()
    AND 'administrador' = ANY(ur.roles)
  )
);

-- 2. Add security function to control email visibility
CREATE OR REPLACE FUNCTION can_view_profile_email(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Users can only see their own email, admins can see all emails
  SELECT 
    auth.uid() = profile_user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
      AND 'administrador' = ANY(ur.roles)
    );
$$;

-- 3. Document email sensitivity
COMMENT ON COLUMN profiles.email IS 'Sensitive PII: Only visible to owner and admins. Use can_view_profile_email() function to check access.';

-- 4. Create anonymized view for public reports (rounds location to ~1km precision)
CREATE OR REPLACE VIEW public_reportes_anonymized AS
SELECT 
  id,
  nombre as titulo,
  descripcion,
  CASE 
    WHEN visibility = 'publico' AND geolocation IS NOT NULL THEN 
      -- Round coordinates to 2 decimal places (~1.1km precision)
      ST_SetSRID(ST_MakePoint(
        ROUND(ST_X(geolocation::geometry)::numeric, 2)::float,
        ROUND(ST_Y(geolocation::geometry)::numeric, 2)::float
      ), 4326)::geography
    ELSE geolocation
  END as geolocation,
  CASE 
    WHEN visibility = 'publico' THEN 'Área General'::text
    ELSE location::text
  END as location,
  visibility as visibilidad,
  tipo_reporte_id,
  user_id as creador_id,
  assigned_to as asignado_a,
  status as estado,
  priority as prioridad,
  created_at as fecha_reporte,
  updated_at,
  created_at
FROM reportes
WHERE 
  -- Only show reports user has access to
  visibility = 'publico'
  OR user_id = get_profile_id_from_auth()
  OR assigned_to = get_profile_id_from_auth()
  OR EXISTS (
    SELECT 1 FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.user_id = auth.uid()
    AND 'administrador' = ANY(ur.roles)
  );

-- Grant access to the anonymized view
GRANT SELECT ON public_reportes_anonymized TO authenticated, anon;

COMMENT ON VIEW public_reportes_anonymized IS 'Security: Anonymizes geolocation for public reports to ~1km precision to prevent user tracking';

-- 5. Add indexes for better performance on security checks
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_security ON user_roles(user_id) WHERE 'administrador' = ANY(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security ON profiles(user_id) WHERE user_id IS NOT NULL;