-- Eliminar la política restrictiva existente
DROP POLICY IF EXISTS "Participantes pueden ver participantes activos" ON participantes_conversacion;

-- Crear nueva política que permita ver participantes activos Y tu propio registro aunque esté oculto
CREATE POLICY "Participantes pueden ver otros activos y su propio registro"
ON participantes_conversacion
FOR SELECT
USING (
  is_conversation_participant(conversacion_id, get_profile_id_from_auth()) 
  AND (
    hidden_at IS NULL  -- Participantes activos
    OR user_id = get_profile_id_from_auth()  -- O tu propio registro aunque esté oculto
  )
);