-- Update handle_new_user to include permisos in user_roles table
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
  user_roles_arr public.user_role[];
  user_permisos_arr public.user_permission[];
  creator_profile_id_txt TEXT;
  creator_profile_id_uuid UUID;
  audit_user_id UUID;
BEGIN
  new_profile_id := gen_random_uuid();
  username := SPLIT_PART(NEW.email, '@', 1);

  -- Extract roles (JSONB -> enum[])
  IF NEW.raw_user_meta_data->'roles' IS NOT NULL THEN
    SELECT ARRAY_AGG(value::public.user_role)
    INTO user_roles_arr
    FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'roles');
  ELSE
    user_roles_arr := ARRAY['usuario_regular']::public.user_role[];
  END IF;

  -- Extract permisos (JSONB -> enum[])
  IF NEW.raw_user_meta_data->'permisos' IS NOT NULL THEN
    SELECT ARRAY_AGG(value::public.user_permission)
    INTO user_permisos_arr
    FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'permisos');
  ELSE
    user_permisos_arr := ARRAY['ver_reporte','crear_reporte']::public.user_permission[];
  END IF;

  -- Safe parse creator_profile_id (may be null or invalid)
  creator_profile_id_txt := NEW.raw_user_meta_data->>'creator_profile_id';
  BEGIN
    IF creator_profile_id_txt IS NULL OR creator_profile_id_txt = '' OR creator_profile_id_txt = 'undefined' THEN
      creator_profile_id_uuid := NULL;
    ELSE
      creator_profile_id_uuid := creator_profile_id_txt::uuid;
    END IF;
  EXCEPTION WHEN others THEN
    creator_profile_id_uuid := NULL;
  END;

  -- First user check
  is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
  IF is_first_user THEN
    user_roles_arr := ARRAY['administrador','mantenimiento','usuario_regular']::public.user_role[];
    user_permisos_arr := ARRAY[
      'ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte',
      'ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
      'ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
      'ver_estado', 'crear_estado', 'editar_estado', 'eliminar_estado',
      'ver_auditoria'
    ]::public.user_permission[];
  END IF;

  -- Audit actor
  IF is_first_user OR creator_profile_id_uuid IS NULL THEN
    audit_user_id := new_profile_id;
  ELSE
    audit_user_id := creator_profile_id_uuid;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, user_id, name, username, email, confirmed)
  VALUES (
    new_profile_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', username),
    username,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL
  );

  -- Insert roles AND permisos in user_roles table
  INSERT INTO public.user_roles (user_id, roles, permisos, assigned_by)
  VALUES (
    new_profile_id,
    user_roles_arr,
    user_permisos_arr,
    COALESCE(creator_profile_id_uuid, new_profile_id)
  );

  -- Audit log
  INSERT INTO public.user_audit (user_id, action, tabla_afectada, metadata, registro_id)
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
      'created_by', CASE WHEN is_first_user THEN 'self' ELSE 'admin' END,
      'roles_assigned', user_roles_arr,
      'permisos_assigned', user_permisos_arr
    ),
    new_profile_id
  );

  RETURN NEW;
END;
$$;