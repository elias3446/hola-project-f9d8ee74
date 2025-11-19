-- Crear función segura para salir de un grupo
CREATE OR REPLACE FUNCTION public.leave_group_safe(_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Obtener el user_id del usuario autenticado desde profiles
  SELECT id INTO _user_id
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Verificar que el usuario es parte de la conversación
  IF NOT EXISTS (
    SELECT 1 
    FROM public.participantes_conversacion
    WHERE conversacion_id = _conversation_id 
    AND user_id = _user_id
  ) THEN
    RETURN false;
  END IF;

  -- Marcar como oculto (abandonar grupo)
  UPDATE public.participantes_conversacion
  SET hidden_at = now()
  WHERE conversacion_id = _conversation_id
  AND user_id = _user_id;

  RETURN true;
END;
$$;