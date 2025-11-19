-- Actualizar función audit_table_changes para registrar automáticamente el registro_id
-- El registro_id capturará el UUID del registro afectado en cada operación

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
  affected_record_id uuid;
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
  
  -- Determinar el tipo de operación y capturar el ID del registro afectado
  IF (TG_OP = 'INSERT') THEN
    operation := 'CREATE';
    old_data := NULL;
    new_data := to_jsonb(NEW);
    affected_record_id := (NEW.id)::uuid;
    
    -- Validate new_data size (max 50KB to prevent DoS)
    IF pg_column_size(new_data) > 51200 THEN
      RAISE WARNING 'Audit data too large for INSERT operation, truncating';
      new_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    changed_fields := ARRAY(SELECT jsonb_object_keys(new_data));
    
  ELSIF (TG_OP = 'UPDATE') THEN
    affected_record_id := (NEW.id)::uuid;
    
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
    affected_record_id := (OLD.id)::uuid;
    
    -- Validate old_data size
    IF pg_column_size(old_data) > 51200 THEN
      RAISE WARNING 'Audit data too large for DELETE operation, truncating';
      old_data := jsonb_build_object('error', 'Data too large to audit');
    END IF;
    
    changed_fields := ARRAY['deleted_at'];
    
  END IF;
  
  -- Insertar registro de auditoría con el registro_id
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    registro_id,
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
    affected_record_id,
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