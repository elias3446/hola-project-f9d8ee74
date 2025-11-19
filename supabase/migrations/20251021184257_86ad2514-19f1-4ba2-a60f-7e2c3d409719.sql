-- Fix admin_sign_out_user function to add proper permission validation
CREATE OR REPLACE FUNCTION public.admin_sign_out_user(user_id_to_sign_out uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  caller_profile_id uuid;
BEGIN
  -- Get the profile_id of the caller
  caller_profile_id := public.get_profile_id_from_auth();
  
  -- Validate caller has admin permissions
  IF NOT public.has_permission(caller_profile_id, 'editar_usuario'::public.user_permission) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can sign out users';
  END IF;
  
  -- Prevent self sign-out
  IF user_id_to_sign_out = auth.uid() THEN
    RAISE EXCEPTION 'Cannot sign out yourself using this function';
  END IF;
  
  -- Eliminar todas las sesiones activas del usuario en auth.sessions
  DELETE FROM auth.sessions
  WHERE user_id = user_id_to_sign_out;
  
  -- Eliminar todos los refresh tokens del usuario en auth.refresh_tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id = user_id_to_sign_out;
  
  -- Log the action for audit trail
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    metadata,
    ip_address
  ) VALUES (
    caller_profile_id,
    'ADMIN_SIGNOUT',
    'auth.sessions',
    jsonb_build_object(
      'timestamp', now(),
      'target_user_id', user_id_to_sign_out,
      'action', 'Force sign out by admin'
    ),
    inet_client_addr()
  );
END;
$function$;