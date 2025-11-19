-- Create RPC function to delete message for everyone
CREATE OR REPLACE FUNCTION delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow deleting your own messages
  UPDATE mensajes
  SET 
    deleted_at = NOW(),
    contenido = 'Este mensaje fue eliminado',
    updated_at = NOW()
  WHERE id = p_message_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se puede eliminar este mensaje';
  END IF;
END;
$$;