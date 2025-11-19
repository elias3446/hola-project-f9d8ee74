-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_reportes_with_distance(double precision, double precision);

-- Recreate the function with profile joins
CREATE OR REPLACE FUNCTION public.get_reportes_with_distance(user_lat double precision, user_lng double precision)
RETURNS TABLE(
  id uuid, 
  nombre text, 
  descripcion text, 
  status report_status, 
  priority report_priority, 
  user_id uuid, 
  assigned_to uuid, 
  categoria_id uuid, 
  tipo_reporte_id uuid, 
  activo boolean, 
  location jsonb, 
  geolocation geography, 
  imagenes text[], 
  visibility report_visibility, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  deleted_at timestamp with time zone, 
  distancia_metros double precision, 
  categories jsonb, 
  tipo_categories jsonb,
  profiles jsonb,
  assigned_profiles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nombre,
    r.descripcion,
    r.status,
    r.priority,
    r.user_id,
    r.assigned_to,
    r.categoria_id,
    r.tipo_reporte_id,
    r.activo,
    r.location,
    r.geolocation,
    r.imagenes,
    r.visibility,
    r.created_at,
    r.updated_at,
    r.deleted_at,
    CASE 
      WHEN r.geolocation IS NOT NULL THEN 
        ST_Distance(
          r.geolocation::geography,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        )
      ELSE NULL
    END as distancia_metros,
    CASE 
      WHEN c.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', c.id,
          'nombre', c.nombre,
          'descripcion', c.descripcion,
          'color', c.color,
          'icono', c.icono
        )
      ELSE NULL
    END as categories,
    CASE 
      WHEN tc.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', tc.id,
          'nombre', tc.nombre,
          'descripcion', tc.descripcion,
          'color', tc.color,
          'icono', tc.icono
        )
      ELSE NULL
    END as tipo_categories,
    CASE 
      WHEN p.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar
        )
      ELSE NULL
    END as profiles,
    CASE 
      WHEN ap.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', ap.id,
          'name', ap.name,
          'avatar', ap.avatar
        )
      ELSE NULL
    END as assigned_profiles
  FROM reportes r
  LEFT JOIN categories c ON r.categoria_id = c.id
  LEFT JOIN tipo_categories tc ON r.tipo_reporte_id = tc.id
  LEFT JOIN profiles p ON r.user_id = p.id
  LEFT JOIN profiles ap ON r.assigned_to = ap.id
  WHERE r.deleted_at IS NULL
  ORDER BY distancia_metros ASC NULLS LAST;
END;
$$;