-- Fix user_audit to record the creator (not the created user) for CREATE actions
-- This ensures we track WHO created the user, not the user themselves

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_profile_id UUID;
  username TEXT;
  is_first_user BOOLEAN;
  user_roles TEXT[];
  user_permisos TEXT[];
  creator_profile_id UUID;
  audit_user_id UUID;
BEGIN
  -- Generate new profile ID
  new_profile_id := gen_random_uuid();
  
  -- Extract username from email
  username := SPLIT_PART(NEW.email, '@', 1);
  
  -- Extract roles and permissions from metadata (these are hints, not trusted for authorization)
  user_roles := COALESCE((NEW.raw_user_meta_data->>'roles')::TEXT[], ARRAY['usuario_regular']);
  user_permisos := COALESCE((NEW.raw_user_meta_data->>'permisos')::TEXT[], ARRAY['ver_reporte', 'crear_reporte']);
  
  -- Extract creator_profile_id from metadata
  creator_profile_id := (NEW.raw_user_meta_data->>'creator_profile_id')::UUID;
  
  -- Check if this is the first user in the system
  is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
  
  -- Determine who should be recorded as the actor in audit log
  -- If first user or no creator specified, use the new user's profile
  -- Otherwise, use the creator's profile
  IF is_first_user OR creator_profile_id IS NULL THEN
    audit_user_id := new_profile_id;
  ELSE
    audit_user_id := creator_profile_id;
  END IF;
  
  -- If first user, assign all roles and permissions
  IF is_first_user THEN
    user_roles := ARRAY['administrador', 'mantenimiento', 'usuario_regular'];
    user_permisos := ARRAY[
      'ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte',
      'ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
      'ver_tipo_reporte', 'crear_tipo_reporte', 'editar_tipo_reporte', 'eliminar_tipo_reporte',
      'ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
      'ver_auditoria'
    ];
  END IF;
  
  -- Create profile record
  INSERT INTO public.profiles (id, user_id, name, username, email, confirmed)
  VALUES (
    new_profile_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', username),
    username,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Insert roles with assigned_by tracking
  INSERT INTO public.user_roles (profile_id, roles, assigned_by)
  VALUES (
    new_profile_id,
    user_roles,
    COALESCE(creator_profile_id, new_profile_id)
  );
  
  -- Insert permissions with assigned_by tracking
  INSERT INTO public.user_permisos (profile_id, permisos, assigned_by)
  VALUES (
    new_profile_id,
    user_permisos,
    COALESCE(creator_profile_id, new_profile_id)
  );
  
  -- Create audit log entry
  -- user_id = who performed the action (creator or self for first user)
  -- registro_id = the profile that was created
  INSERT INTO public.user_audit (
    user_id,
    action,
    tabla_afectada,
    metadata,
    registro_id
  )
  VALUES (
    audit_user_id,
    'CREATE',
    'profiles',
    jsonb_build_object(
      'email', NEW.email,
      'username', username,
      'confirmed', NEW.email_confirmed_at IS NOT NULL,
      'timestamp', NOW(),
      'is_first_user', is_first_user,
      'created_by', CASE 
        WHEN is_first_user THEN 'self' 
        ELSE 'admin' 
      END
    ),
    new_profile_id
  );
  
  RETURN NEW;
END;
$$;