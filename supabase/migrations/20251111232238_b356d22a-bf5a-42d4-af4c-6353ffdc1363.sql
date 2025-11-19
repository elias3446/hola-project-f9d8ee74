-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS delete_message_for_everyone(uuid);

CREATE OR REPLACE FUNCTION delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO v_user_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  -- Verify ownership and update
  UPDATE mensajes
  SET 
    deleted_at = NOW(),
    contenido = 'Este mensaje fue eliminado',
    updated_at = NOW()
  WHERE id = p_message_id
    AND user_id = v_user_id
    AND deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se puede eliminar este mensaje';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_message_for_everyone(uuid) TO authenticated;