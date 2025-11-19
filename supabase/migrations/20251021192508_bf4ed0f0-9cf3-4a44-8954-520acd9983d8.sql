-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to reportes table
-- Using Point type with SRID 4326 (WGS 84 - standard for GPS coordinates)
ALTER TABLE public.reportes
ADD COLUMN IF NOT EXISTS geolocation geography(Point, 4326);

-- Create spatial index for better query performance
CREATE INDEX IF NOT EXISTS idx_reportes_geolocation 
ON public.reportes USING GIST (geolocation);

-- Optional: Add a trigger to automatically populate geolocation from location jsonb
CREATE OR REPLACE FUNCTION public.sync_reportes_geolocation()
RETURNS TRIGGER AS $$
BEGIN
  -- If location jsonb has latitude and longitude, populate geolocation
  IF NEW.location IS NOT NULL 
     AND NEW.location->>'latitude' IS NOT NULL 
     AND NEW.location->>'longitude' IS NOT NULL THEN
    NEW.geolocation := ST_SetSRID(
      ST_MakePoint(
        (NEW.location->>'longitude')::double precision,
        (NEW.location->>'latitude')::double precision
      ),
      4326
    )::geography;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync geolocation on insert/update
DROP TRIGGER IF EXISTS sync_reportes_geolocation_trigger ON public.reportes;
CREATE TRIGGER sync_reportes_geolocation_trigger
BEFORE INSERT OR UPDATE ON public.reportes
FOR EACH ROW
EXECUTE FUNCTION public.sync_reportes_geolocation();

-- Backfill existing records with geolocation data
UPDATE public.reportes
SET geolocation = ST_SetSRID(
  ST_MakePoint(
    (location->>'longitude')::double precision,
    (location->>'latitude')::double precision
  ),
  4326
)::geography
WHERE location IS NOT NULL 
  AND location->>'latitude' IS NOT NULL 
  AND location->>'longitude' IS NOT NULL
  AND geolocation IS NULL;