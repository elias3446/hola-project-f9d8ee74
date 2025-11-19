-- Add real-time tracking setting to settings table
ALTER TABLE public.settings
ADD COLUMN real_time_tracking_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.settings.real_time_tracking_enabled IS 'Habilita o deshabilita las notificaciones de rastreo en tiempo real cuando el usuario está cerca de un reporte';