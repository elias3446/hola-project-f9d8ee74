-- Corregir hide_conversation_for_user para que solo oculte de "Todos"
-- y mantenga los grupos visibles en "Mis Grupos"

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

  -- Marcar hidden_at para ocultar solo de "Todos"
  -- Los grupos seguirán visibles en "Mis Grupos" porque no se marca hidden_from_all
  UPDATE public.participantes_conversacion
  SET hidden_at = now()
  WHERE conversacion_id = _conversation_id
    AND user_id = _profile_id;

  GET DIAGNOSTICS _updated = ROW_COUNT;

  RETURN _updated > 0;
END;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.hide_conversation_for_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hide_conversation_for_user(uuid) TO authenticated;