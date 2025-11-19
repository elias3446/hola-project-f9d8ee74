-- Corregir función de auditoría automática para usar profile.id en lugar de auth.users.id
CREATE OR REPLACE FUNCTION public.auto_audit_auth_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Para eventos de login (cuando last_sign_in_at cambia)
  IF (TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at) THEN
    -- Obtener el profile_id correspondiente al auth user
    SELECT id INTO profile_id
    FROM public.profiles
    WHERE user_id = NEW.id;
    
    -- Solo registrar si existe el perfil
    IF profile_id IS NOT NULL THEN
      INSERT INTO public.user_audit (
        user_id,
        action,
        tabla_afectada,
        metadata,
        ip_address
      ) VALUES (
        profile_id,
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Corregir función de logout para usar profile.id
CREATE OR REPLACE FUNCTION public.audit_logout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Obtener el profile_id del usuario autenticado
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO profile_id
    FROM public.profiles
    WHERE user_id = auth.uid();
    
    -- Solo registrar si existe el perfil
    IF profile_id IS NOT NULL THEN
      INSERT INTO public.user_audit (
        user_id,
        action,
        tabla_afectada,
        metadata,
        ip_address
      ) VALUES (
        profile_id,
        'LOGOUT',
        'auth.users',
        jsonb_build_object(
          'timestamp', now(),
          'logout_time', now()
        ),
        inet_client_addr()
      );
    END IF;
  END IF;
END;
$$;