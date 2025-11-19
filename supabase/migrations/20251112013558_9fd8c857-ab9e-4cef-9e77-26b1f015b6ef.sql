-- Drop the conflicting policy that filters out hidden conversations
DROP POLICY IF EXISTS "Participantes pueden ver conversaciones activas" ON conversaciones;

-- Update the group conversations policy to be more explicit
DROP POLICY IF EXISTS "Participants can view group conversations (including hidden)" ON conversaciones;

-- Create a comprehensive policy that handles both individual and group conversations correctly
CREATE POLICY "Participantes pueden ver sus conversaciones" ON conversaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = conversaciones.id
      AND participantes_conversacion.user_id = get_profile_id_from_auth()
      AND (
        -- For groups: always visible regardless of hidden_at
        conversaciones.es_grupo = true
        -- For individual conversations: only visible if not hidden
        OR participantes_conversacion.hidden_at IS NULL
      )
  )
);