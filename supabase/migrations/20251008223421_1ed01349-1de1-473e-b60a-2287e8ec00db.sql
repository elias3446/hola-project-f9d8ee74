-- Crear trigger para auditar login automáticamente
-- Este trigger se ejecuta cuando Supabase Auth registra un login exitoso
CREATE OR REPLACE FUNCTION public.auto_audit_auth_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Para eventos de login (cuando last_sign_in_at cambia)
  IF (TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at) THEN
    -- Registrar login
    INSERT INTO public.user_audit (
      user_id,
      action,
      tabla_afectada,
      metadata,
      ip_address
    ) VALUES (
      NEW.id,
      'LOGIN',
      'auth.users',
      jsonb_build_object(
        'timestamp', now(),
        'login_time', NEW.last_sign_in_at,
        'email', NEW.email
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger en auth.users para login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_audit_auth_events();

-- Función para registrar logout (se llama manualmente desde signOut)
CREATE OR REPLACE FUNCTION public.audit_logout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar logout del usuario autenticado
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_audit (
      user_id,
      action,
      tabla_afectada,
      metadata,
      ip_address
    ) VALUES (
      auth.uid(),
      'LOGOUT',
      'auth.users',
      jsonb_build_object(
        'timestamp', now(),
        'logout_time', now()
      ),
      inet_client_addr()
    );
  END IF;
END;
$$;