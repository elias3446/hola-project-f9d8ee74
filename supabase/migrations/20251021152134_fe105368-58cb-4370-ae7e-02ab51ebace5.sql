-- Fix log_reporte_assignment to use profile_id instead of auth.uid()
CREATE OR REPLACE FUNCTION public.log_reporte_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_profile_id UUID;
BEGIN
  -- Only log if assigned_to actually changed
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) OR 
     (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) THEN
    
    -- Get the profile_id of the current user
    current_profile_id := get_profile_id_from_auth();
    
    INSERT INTO public.reporte_historial (
      reporte_id,
      assigned_by,
      assigned_from,
      assigned_to,
      comentario,
      fecha_asignacion
    ) VALUES (
      NEW.id,
      current_profile_id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_to ELSE NULL END,
      NEW.assigned_to,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Reporte creado y asignado'
        ELSE 'Reporte reasignado'
      END,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;