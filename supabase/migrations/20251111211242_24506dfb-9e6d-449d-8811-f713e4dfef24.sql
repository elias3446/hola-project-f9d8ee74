-- Fix RLS policy for mensajes UPDATE to allow soft deletes
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios mensajes" ON public.mensajes;

CREATE POLICY "Usuarios pueden actualizar sus propios mensajes" 
ON public.mensajes
FOR UPDATE 
USING (get_profile_id_from_auth() = user_id)
WITH CHECK (get_profile_id_from_auth() = user_id);