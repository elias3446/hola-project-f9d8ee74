-- Add hidden_by_users column to mensajes table
ALTER TABLE public.mensajes 
ADD COLUMN IF NOT EXISTS hidden_by_users jsonb DEFAULT '[]'::jsonb;

-- Add index for better performance when filtering hidden messages
CREATE INDEX IF NOT EXISTS idx_mensajes_hidden_by_users ON public.mensajes USING gin(hidden_by_users);

-- Update RLS policy to filter hidden messages for the current user
DROP POLICY IF EXISTS "Participantes pueden ver mensajes de conversaciones activas" ON public.mensajes;

CREATE POLICY "Participantes pueden ver mensajes de conversaciones activas"
ON public.mensajes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = mensajes.conversacion_id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
    AND participantes_conversacion.hidden_at IS NULL
  )
  AND (
    deleted_at IS NULL 
    AND NOT (hidden_by_users @> jsonb_build_array(get_profile_id_from_auth()))
  )
);