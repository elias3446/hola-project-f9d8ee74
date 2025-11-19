-- Add size validation to audit trigger functions to prevent DoS attacks

-- Update the audit_table_changes function to validate metadata size
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  operation operation_type;
  current_profile_id uuid;
BEGIN
  -- Obtener el profile_id del usuario autenticado
  current_profile_id := public.get_profile_id_from_auth();
  
  -- Si no hay perfil, no auditar (podría ser una operación del sistema)
  IF current_profile_id IS NULL THEN
    IF (TG_OP = 'DELETE') THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Determinar el tipo de operación
  IF (TG_OP = 'INSERT') THEN
    operation := 'CREATE';
    old_data := NULL;
    new_data := to_jsonb(NEW);
    
    -- Validate new_data size (max 50KB to prevent DoS)
    IF pg_column_size(new_data) > 51200 THEN
      RAISE WARNING 'Audit data too large for INSERT operation, truncating';
      new_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    changed_fields := ARRAY(SELECT jsonb_object_keys(new_data));
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Verificar si es un soft delete (deleted_at cambia de NULL a un valor)
    IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
      operation := 'SOFT_DELETE';
    ELSE
      operation := 'UPDATE';
    END IF;
    
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Validate data sizes (max 50KB each to prevent DoS)
    IF pg_column_size(old_data) > 51200 THEN
      RAISE WARNING 'Old audit data too large for UPDATE operation, truncating';
      old_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    IF pg_column_size(new_data) > 51200 THEN
      RAISE WARNING 'New audit data too large for UPDATE operation, truncating';
      new_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    -- Identificar campos que cambiaron
    changed_fields := ARRAY(
      SELECT key
      FROM jsonb_each(old_data) old_val
      JOIN jsonb_each(new_data) new_val USING (key)
      WHERE old_val.value IS DISTINCT FROM new_val.value
    );
    
  ELSIF (TG_OP = 'DELETE') THEN
    operation := 'SOFT_DELETE';
    old_data := to_jsonb(OLD);
    new_data := NULL;
    
    -- Validate old_data size
    IF pg_column_size(old_data) > 51200 THEN
      RAISE WARNING 'Audit data too large for DELETE operation, truncating';
      old_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    changed_fields := ARRAY['deleted_at'];
    
  END IF;
  
  -- Insertar registro de auditoría
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    campos_modificados,
    valores_anteriores,
    valores_nuevos,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    current_profile_id,
    operation,
    TG_TABLE_NAME,
    changed_fields,
    old_data,
    new_data,
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP,
      'table_schema', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Improve record_failed_login to validate IP address format
CREATE OR REPLACE FUNCTION public.record_failed_login(p_email text, p_ip_address inet DEFAULT NULL::inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt record;
  v_new_count int;
  v_lock_until timestamp with time zone;
  v_locked boolean := false;
  v_remaining_ms bigint := 0;
BEGIN
  -- Validar formato de email y longitud máxima (RFC 5321: 320 chars max)
  IF p_email IS NULL OR length(p_email) > 320 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud mínima de email
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
$function$;

-- Improve check_login_lockout with better email validation
CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email text, p_ip_address inet DEFAULT NULL::inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt record;
  v_locked boolean := false;
  v_remaining_ms bigint := 0;
  v_attempts_left int := 3;
BEGIN
  -- Validar formato de email y longitud máxima (RFC 5321: 320 chars max)
  IF p_email IS NULL OR length(p_email) > 320 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud mínima de email
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
$function$;

-- Improve reset_login_attempts with better email validation
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar formato de email y longitud máxima (RFC 5321: 320 chars max)
  IF p_email IS NULL OR length(p_email) > 320 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validar longitud mínima de email
  IF length(p_email) < 3 THEN
    RAISE EXCEPTION 'Email too short';
  END IF;
  
  DELETE FROM public.login_attempts
  WHERE email = lower(p_email);
END;
$function$;