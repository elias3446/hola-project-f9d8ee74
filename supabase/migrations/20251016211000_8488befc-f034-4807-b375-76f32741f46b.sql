-- Función para cerrar todas las sesiones de un usuario (admin)
CREATE OR REPLACE FUNCTION public.admin_sign_out_user(user_id_to_sign_out UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar todas las sesiones activas del usuario en auth.sessions
  DELETE FROM auth.sessions
  WHERE user_id = user_id_to_sign_out;
  
  -- Eliminar todos los refresh tokens del usuario en auth.refresh_tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id = user_id_to_sign_out;
END;
$$;