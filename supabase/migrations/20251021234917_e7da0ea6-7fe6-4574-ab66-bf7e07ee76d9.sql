-- Revoke public access to PostGIS system tables from PostgREST roles
-- This prevents the tables from being accessible via the REST API
-- while keeping them available for internal database operations

-- Revoke permissions from anon role (unauthenticated API access)
REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon;
REVOKE ALL ON TABLE public.spatial_ref_sys FROM authenticated;

-- Revoke permissions from geography_columns if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'geography_columns'
  ) THEN
    REVOKE ALL ON TABLE public.geography_columns FROM anon;
    REVOKE ALL ON TABLE public.geography_columns FROM authenticated;
  END IF;
END $$;

-- Revoke permissions from geometry_columns if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'geometry_columns'
  ) THEN
    REVOKE ALL ON TABLE public.geometry_columns FROM anon;
    REVOKE ALL ON TABLE public.geometry_columns FROM authenticated;
  END IF;
END $$;

-- Grant usage to postgres role for internal operations (triggers, functions, etc.)
GRANT SELECT ON TABLE public.spatial_ref_sys TO postgres;

-- Note: The tables remain accessible to database functions and internal operations,
-- but are no longer exposed through the PostgREST API