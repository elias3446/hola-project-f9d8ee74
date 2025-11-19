-- Función completa para cambiar el email de un usuario
-- Maneja todo el proceso incluyendo la eliminación del usuario viejo
CREATE OR REPLACE FUNCTION public.complete_email_change(
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
  v_new_username TEXT;
BEGIN
  -- Validar permiso
  IF NOT has_permission(get_profile_id_from_auth(), 'editar_usuario'::user_permission) THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar emails de usuarios';
  END IF;

  -- Obtener datos actuales del perfil
  SELECT user_id, email INTO v_old_user_id, v_old_email
  FROM profiles
  WHERE id = p_profile_id;

  IF v_old_user_id IS NULL THEN
    RAISE EXCEPTION 'El perfil no existe o ya está desvinculado';
  END IF;

  -- Verificar que el nuevo email no esté en uso
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_new_email) THEN
    RAISE EXCEPTION 'El email % ya está en uso', p_new_email;
  END IF;

  -- Generar nuevo username
  v_new_username := generate_unique_username(p_new_email);

  -- PASO 1: Desvincular el perfil del usuario viejo
  UPDATE profiles
  SET 
    user_id = NULL,
    email = p_new_email,
    username = v_new_username,
    confirmed = false,
    updated_at = now()
  WHERE id = p_profile_id;

  -- PASO 2: Eliminar el usuario viejo de auth.users
  DELETE FROM auth.users WHERE id = v_old_user_id;

  -- Retornar información del cambio
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'old_email', v_old_email,
    'new_email', p_new_email,
    'new_username', v_new_username,
    'message', 'Email preparado para cambio. El usuario debe registrarse con el nuevo email.'
  );
END;
$$;