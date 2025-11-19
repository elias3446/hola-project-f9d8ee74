-- Drop the creator policy that bypasses the hidden logic
DROP POLICY IF EXISTS "Creador puede ver su conversación" ON conversaciones;

-- Update the main policy to handle creator AND participant logic together
DROP POLICY IF EXISTS "Participantes pueden ver sus conversaciones" ON conversaciones;

CREATE POLICY "Usuarios pueden ver sus conversaciones" ON conversaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = conversaciones.id
      AND participantes_conversacion.user_id = get_profile_id_from_auth()
      AND (
        -- Groups are ALWAYS visible, even if hidden (for "Mis Grupos")
        conversaciones.es_grupo = true
        -- Individual conversations only visible if NOT hidden
        OR participantes_conversacion.hidden_at IS NULL
      )
  )
);