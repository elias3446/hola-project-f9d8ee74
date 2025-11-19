-- Create function to clear messages for a specific user
-- This adds the user's ID to the hidden_by_users array for all messages in a conversation
CREATE OR REPLACE FUNCTION clear_messages_for_user(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all messages in the conversation to hide them for the current user
  UPDATE mensajes
  SET hidden_by_users = COALESCE(hidden_by_users, '[]'::jsonb) || jsonb_build_array(get_profile_id_from_auth())
  WHERE conversacion_id = _conversation_id
    AND NOT (hidden_by_users @> jsonb_build_array(get_profile_id_from_auth()))
    AND EXISTS (
      SELECT 1 
      FROM participantes_conversacion 
      WHERE conversacion_id = _conversation_id 
        AND user_id = get_profile_id_from_auth()
    );
END;
$$;