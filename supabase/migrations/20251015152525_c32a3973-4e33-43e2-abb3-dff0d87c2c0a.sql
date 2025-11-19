-- Función para preparar el perfil para cambio de email
-- Esta función desvincula el perfil del auth.user actual
CREATE OR REPLACE FUNCTION public.prepare_email_change(
  p_profile_id UUID,
  p_new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_user_id UUID;
  v_old_email TEXT;
BEGIN
  -- Validar permiso
  IF NOT has_permission(get_profile_id_from_auth(), 'editar_usuario'::user_permission) THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar emails de usuarios';
  END IF;

  -- Obtener datos actuales
  SELECT user_id, email INTO v_old_user_id, v_old_email
  FROM profiles
  WHERE id = p_profile_id;

  IF v_old_user_id IS NULL THEN
    RAISE EXCEPTION 'El perfil ya está desvinculado o no existe';
  END IF;

  -- Guardar el user_id antiguo en metadata para poder eliminarlo después
  UPDATE profiles
  SET 
    user_id = NULL,
    email = p_new_email,
    username = NULL,
    updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_user_id', v_old_user_id,
    'old_email', v_old_email,
    'new_email', p_new_email,
    'profile_id', p_profile_id
  );
END;
$$;

-- Función para reconectar el perfil con el nuevo usuario
CREATE OR REPLACE FUNCTION public.reconnect_profile_after_email_change(
  p_profile_id UUID,
  p_new_user_id UUID,
  p_new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_username TEXT;
BEGIN
  -- Generar nuevo username
  v_new_username := generate_unique_username(p_new_email);

  -- Reconectar el perfil
  UPDATE profiles
  SET 
    user_id = p_new_user_id,
    email = p_new_email,
    username = v_new_username,
    confirmed = false,
    updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'new_user_id', p_new_user_id,
    'new_email', p_new_email,
    'new_username', v_new_username
  );
END;
$$;