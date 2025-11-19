-- Drop existing functions first
DROP FUNCTION IF EXISTS public.prepare_email_change(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reconnect_profile_after_email_change(UUID, UUID, TEXT);

-- Improve prepare_email_change with better logging and validation
CREATE FUNCTION public.prepare_email_change(
  p_profile_id UUID,
  p_new_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_user_id UUID;
  v_old_email TEXT;
BEGIN
  -- Validate permission
  IF NOT has_permission(auth.uid(), 'editar_usuario') THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar el email de usuarios';
  END IF;

  -- Get current profile information
  SELECT user_id, email INTO v_old_user_id, v_old_email
  FROM profiles
  WHERE id = p_profile_id;

  IF v_old_user_id IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado o ya desconectado';
  END IF;

  -- Validate email format
  IF p_new_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;

  -- Check if new email already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_new_email AND id != p_profile_id) THEN
    RAISE EXCEPTION 'El email ya está en uso';
  END IF;

  -- Log the email change preparation
  INSERT INTO user_audit (
    user_id,
    action,
    tabla_afectada,
    registro_id,
    ip_address,
    metadata,
    valores_anteriores
  ) VALUES (
    auth.uid(),
    'prepare_email_change',
    'profiles',
    p_profile_id,
    inet_client_addr(),
    jsonb_build_object(
      'profile_id', p_profile_id,
      'new_email', p_new_email,
      'step', 'unlink_profile'
    ),
    jsonb_build_object(
      'old_email', v_old_email,
      'old_user_id', v_old_user_id
    )
  );

  -- Unlink profile from auth user
  UPDATE profiles
  SET user_id = NULL,
      updated_at = now()
  WHERE id = p_profile_id;

  -- Delete old auth user
  DELETE FROM auth.users WHERE id = v_old_user_id;
END;
$$;

-- Improve reconnect_profile_after_email_change with better validation and logging
CREATE FUNCTION public.reconnect_profile_after_email_change(
  p_profile_id UUID,
  p_new_user_id UUID,
  p_new_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_profile_created_at TIMESTAMPTZ;
BEGIN
  -- Get profile information
  SELECT user_id, created_at INTO v_current_user_id, v_profile_created_at
  FROM profiles
  WHERE id = p_profile_id;

  -- Validate profile exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  -- Validate profile is in transition state (user_id should be NULL)
  IF v_current_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Perfil ya está conectado a un usuario';
  END IF;

  -- Validate new user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_new_user_id) THEN
    RAISE EXCEPTION 'Usuario de autenticación no encontrado';
  END IF;

  -- Validate email format
  IF p_new_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;

  -- Check if new email is already in use by another profile
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_new_email AND id != p_profile_id) THEN
    RAISE EXCEPTION 'El email ya está en uso por otro perfil';
  END IF;

  -- Reconnect profile with new user
  UPDATE profiles
  SET user_id = p_new_user_id,
      email = p_new_email,
      updated_at = now()
  WHERE id = p_profile_id;

  -- Log successful reconnection
  INSERT INTO user_audit (
    user_id,
    action,
    tabla_afectada,
    registro_id,
    ip_address,
    metadata,
    valores_nuevos
  ) VALUES (
    p_new_user_id,
    'reconnect_profile_after_email_change',
    'profiles',
    p_profile_id,
    inet_client_addr(),
    jsonb_build_object(
      'profile_id', p_profile_id,
      'new_user_id', p_new_user_id,
      'step', 'reconnect_complete'
    ),
    jsonb_build_object(
      'new_email', p_new_email,
      'new_user_id', p_new_user_id
    )
  );
END;
$$;

-- Add a cleanup function to handle orphaned profiles with NULL user_id
CREATE FUNCTION public.cleanup_orphaned_profiles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Only allow admins to run this cleanup
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden ejecutar la limpieza de perfiles huérfanos';
  END IF;

  -- Delete profiles that have been disconnected for more than 1 hour
  WITH deleted AS (
    DELETE FROM profiles
    WHERE user_id IS NULL
      AND updated_at < now() - INTERVAL '1 hour'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Log the cleanup operation
  IF v_deleted_count > 0 THEN
    INSERT INTO user_audit (
      user_id,
      action,
      tabla_afectada,
      ip_address,
      metadata
    ) VALUES (
      auth.uid(),
      'cleanup_orphaned_profiles',
      'profiles',
      inet_client_addr(),
      jsonb_build_object(
        'profiles_deleted', v_deleted_count
      )
    );
  END IF;

  RETURN v_deleted_count;
END;
$$;