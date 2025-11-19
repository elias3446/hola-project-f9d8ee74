-- Create function to calculate distance between user position and reports
CREATE OR REPLACE FUNCTION public.get_reportes_with_distance(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  descripcion TEXT,
  status report_status,
  priority report_priority,
  visibility report_visibility,
  activo BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  user_id UUID,
  assigned_to UUID,
  categoria_id UUID,
  tipo_reporte_id UUID,
  location JSONB,
  geolocation GEOGRAPHY,
  imagenes TEXT[],
  distancia_metros DOUBLE PRECISION,
  categoria_nombre TEXT,
  tipo_reporte_nombre TEXT,
  reportador_nombre TEXT,
  asignado_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nombre,
    r.descripcion,
    r.status,
    r.priority,
    r.visibility,
    r.activo,
    r.created_at,
    r.updated_at,
    r.deleted_at,
    r.user_id,
    r.assigned_to,
    r.categoria_id,
    r.tipo_reporte_id,
    r.location,
    r.geolocation,
    r.imagenes,
    CASE 
      WHEN r.geolocation IS NOT NULL THEN
        ST_Distance(
          r.geolocation::geography,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        )
      ELSE NULL
    END as distancia_metros,
    c.nombre as categoria_nombre,
    tc.nombre as tipo_reporte_nombre,
    p1.name as reportador_nombre,
    p2.name as asignado_nombre
  FROM reportes r
  LEFT JOIN categories c ON r.categoria_id = c.id
  LEFT JOIN tipo_categories tc ON r.tipo_reporte_id = tc.id
  LEFT JOIN profiles p1 ON r.user_id = p1.id
  LEFT JOIN profiles p2 ON r.assigned_to = p2.id
  WHERE r.deleted_at IS NULL
    AND r.activo = true
    AND (
      has_permission(get_profile_id_from_auth(), 'ver_reporte'::user_permission)
      OR r.visibility = 'publico'::report_visibility
      OR get_profile_id_from_auth() = r.user_id
      OR get_profile_id_from_auth() = r.assigned_to
    )
  ORDER BY distancia_metros ASC NULLS LAST;
END;
$$;