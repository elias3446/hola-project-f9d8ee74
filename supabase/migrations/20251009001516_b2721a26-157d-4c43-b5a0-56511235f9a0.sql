-- Fix Critical Security Issue: Audit Functions Allow Impersonation
-- Add validation to ensure p_user_id matches authenticated user

CREATE OR REPLACE FUNCTION public.audit_user_login(
  p_user_id uuid,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
BEGIN
  -- CRITICAL: Validate that p_user_id matches authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create audit logs for other users. Attempted user_id: %, Auth user: %', p_user_id, auth.uid();
  END IF;

  -- Validate metadata size to prevent DoS
  IF pg_column_size(p_metadata) > 10000 THEN
    RAISE EXCEPTION 'Metadata size exceeds maximum allowed (10KB)';
  END IF;
  
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'LOGIN',
    'auth.users',
    jsonb_build_object(
      'timestamp', now(),
      'login_time', now(),
      'session_metadata', p_metadata
    ),
    COALESCE(p_ip_address, inet_client_addr()),
    p_user_agent
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_user_logout(
  p_user_id uuid,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
BEGIN
  -- CRITICAL: Validate that p_user_id matches authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create audit logs for other users. Attempted user_id: %, Auth user: %', p_user_id, auth.uid();
  END IF;

  -- Validate metadata size to prevent DoS
  IF pg_column_size(p_metadata) > 10000 THEN
    RAISE EXCEPTION 'Metadata size exceeds maximum allowed (10KB)';
  END IF;
  
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'LOGOUT',
    'auth.users',
    jsonb_build_object(
      'timestamp', now(),
      'logout_time', now(),
      'session_metadata', p_metadata
    ),
    COALESCE(p_ip_address, inet_client_addr()),
    p_user_agent
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Fix High Priority Issue: Login Security Functions Lack Input Validation
-- Add comprehensive validation to login security functions

CREATE OR REPLACE FUNCTION public.check_login_lockout(
  p_email text,
  p_ip_address inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt record;
  v_locked boolean := false;
  v_remaining_ms bigint := 0;
  v_attempts_left int := 3;
BEGIN
  -- Validar formato de email
  IF p_email IS NULL OR length(p_email) > 255 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud de email
  IF length(p_email) < 3 THEN
    RAISE EXCEPTION 'Email too short';
  END IF;
  
  -- Buscar intentos existentes
  SELECT * INTO v_attempt
  FROM public.login_attempts
  WHERE email = lower(p_email);
  
  -- Si existe un registro
  IF FOUND THEN
    -- Verificar si está bloqueado
    IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
      v_locked := true;
      v_remaining_ms := EXTRACT(EPOCH FROM (v_attempt.locked_until - now())) * 1000;
      v_attempts_left := 0;
    ELSE
      -- Si el bloqueo expiró, limpiar
      IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until <= now() THEN
        UPDATE public.login_attempts
        SET attempt_count = 0,
            locked_until = NULL
        WHERE email = lower(p_email);
        v_attempts_left := 3;
      ELSE
        v_attempts_left := GREATEST(0, 3 - v_attempt.attempt_count);
      END IF;
    END IF;
  END IF;
  
  -- NO revelar información específica del email - siempre retornar estructura similar
  RETURN jsonb_build_object(
    'is_locked', v_locked,
    'remaining_ms', v_remaining_ms,
    'attempts_left', v_attempts_left
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email text,
  p_ip_address inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt record;
  v_new_count int;
  v_lock_until timestamp with time zone;
  v_locked boolean := false;
  v_remaining_ms bigint := 0;
BEGIN
  -- Validar formato de email
  IF p_email IS NULL OR length(p_email) > 255 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud de email
  IF length(p_email) < 3 THEN
    RAISE EXCEPTION 'Email too short';
  END IF;
  
  -- Limitar frecuencia de llamadas (rate limiting básico)
  -- Verificar si hay demasiados intentos recientes desde esta IP
  IF p_ip_address IS NOT NULL THEN
    PERFORM 1 FROM public.login_attempts 
    WHERE ip_address = p_ip_address 
    AND last_attempt_at > now() - interval '10 seconds'
    LIMIT 1;
    
    IF FOUND THEN
      -- Esperar un poco antes de permitir otro intento
      RAISE EXCEPTION 'Too many requests. Please wait a moment.';
    END IF;
  END IF;
  
  -- Buscar registro existente
  SELECT * INTO v_attempt
  FROM public.login_attempts
  WHERE email = lower(p_email);
  
  IF FOUND THEN
    -- Incrementar contador
    v_new_count := v_attempt.attempt_count + 1;
    
    -- Si alcanza 3 intentos, bloquear por 1 hora
    IF v_new_count >= 3 THEN
      v_lock_until := now() + interval '1 hour';
      v_locked := true;
      v_remaining_ms := 3600000; -- 1 hora en ms
    END IF;
    
    -- Actualizar registro
    UPDATE public.login_attempts
    SET attempt_count = v_new_count,
        last_attempt_at = now(),
        locked_until = v_lock_until,
        ip_address = COALESCE(p_ip_address, v_attempt.ip_address),
        updated_at = now()
    WHERE email = lower(p_email);
  ELSE
    -- Crear nuevo registro
    v_new_count := 1;
    INSERT INTO public.login_attempts (email, attempt_count, ip_address, last_attempt_at)
    VALUES (lower(p_email), 1, p_ip_address, now());
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', v_locked,
    'remaining_ms', v_remaining_ms,
    'attempts_left', GREATEST(0, 3 - v_new_count),
    'attempt_count', v_new_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_login_attempts(
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar formato de email
  IF p_email IS NULL OR length(p_email) > 255 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud de email
  IF length(p_email) < 3 THEN
    RAISE EXCEPTION 'Email too short';
  END IF;
  
  DELETE FROM public.login_attempts
  WHERE email = lower(p_email);
END;
$$;