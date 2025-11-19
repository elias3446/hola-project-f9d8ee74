-- Agregar campo para diferenciar "ocultar de Todos" vs "salir del grupo"
-- hidden_from_todos: oculta solo de sección "Todos", usuario sigue activo
-- hidden_at: usuario salió del grupo (no puede enviar mensajes)

ALTER TABLE public.participantes_conversacion
ADD COLUMN IF NOT EXISTS hidden_from_todos boolean DEFAULT false;

-- Actualizar la función hide_conversation_for_user
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

  -- Marcar hidden_from_todos = true para ocultar solo de "Todos"
  -- El usuario sigue siendo miembro activo del grupo
  UPDATE public.participantes_conversacion
  SET hidden_from_todos = true
  WHERE conversacion_id = _conversation_id
    AND user_id = _profile_id;

  GET DIAGNOSTICS _updated = ROW_COUNT;

  RETURN _updated > 0;
END;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.hide_conversation_for_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hide_conversation_for_user(uuid) TO authenticated;