-- Corregir la función hide_conversation_for_user
-- Para cualquier conversación (grupo o individual), debe marcar hidden_from_all
-- Esto la oculta de "Todos" pero los grupos siguen en "Mis Grupos"

DROP FUNCTION IF EXISTS public.hide_conversation_for_user(uuid);

CREATE FUNCTION public.hide_conversation_for_user(_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid := get_profile_id_from_auth();
  _updated int;
BEGIN
  IF _profile_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Marcar hidden_from_all = true para ocultar de "Todos"
  -- Los grupos seguirán visibles en "Mis Grupos"
  UPDATE public.participantes_conversacion
  SET hidden_from_all = true
  WHERE conversacion_id = _conversation_id
    AND user_id = _profile_id;

  GET DIAGNOSTICS _updated = ROW_COUNT;

  RETURN _updated > 0;
END;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.hide_conversation_for_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hide_conversation_for_user(uuid) TO authenticated;