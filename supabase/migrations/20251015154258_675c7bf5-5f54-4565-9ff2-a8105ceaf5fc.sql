-- Modificar trigger handle_new_user para reconectar perfiles existentes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id UUID;
  generated_username text;
  is_first_user boolean;
  user_roles user_role[];
  user_permisos user_permission[];
  existing_profile_id UUID;
BEGIN
  -- Verificar si hay un perfil existente a reconectar
  existing_profile_id := (NEW.raw_user_meta_data->>'existing_profile_id')::uuid;
  
  IF existing_profile_id IS NOT NULL THEN
    -- Reconectar perfil existente
    generated_username := public.generate_unique_username(NEW.email);
    
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      email = NEW.email,
      username = generated_username,
      confirmed = NEW.email_confirmed_at IS NOT NULL,
      updated_at = now()
    WHERE id = existing_profile_id;
    
    new_profile_id := existing_profile_id;
  ELSE
    -- Verificar si es el primer usuario
    is_first_user := NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
    
    -- Generate unique username from email
    generated_username := public.generate_unique_username(NEW.email);
    
    -- Insert into profiles with generated username
    INSERT INTO public.profiles (user_id, email, name, username, confirmed)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
      generated_username,
      NEW.email_confirmed_at IS NOT NULL
    )
    RETURNING id INTO new_profile_id;
    
    -- Si es el primer usuario, asignar todos los roles y permisos
    IF is_first_user THEN
      INSERT INTO public.user_roles (user_id, roles, permisos)
      VALUES (
        new_profile_id, 
        ARRAY['administrador', 'mantenimiento', 'usuario_regular']::user_role[],
        ARRAY[
          'ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte',
          'ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
          'ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
          'ver_estado', 'crear_estado', 'editar_estado', 'eliminar_estado'
        ]::user_permission[]
      );
    ELSE
      -- Leer roles y permisos desde raw_user_meta_data
      IF NEW.raw_user_meta_data ? 'roles' AND NEW.raw_user_meta_data->>'roles' IS NOT NULL THEN
        user_roles := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles'))::user_role[];
      ELSE
        user_roles := ARRAY['usuario_regular']::user_role[];
      END IF;
      
      IF NEW.raw_user_meta_data ? 'permisos' AND NEW.raw_user_meta_data->>'permisos' IS NOT NULL THEN
        user_permisos := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permisos'))::user_permission[];
      ELSE
        user_permisos := ARRAY['ver_reporte', 'crear_reporte']::user_permission[];
      END IF;
      
      -- Insertar roles y permisos
      INSERT INTO public.user_roles (user_id, roles, permisos)
      VALUES (new_profile_id, user_roles, user_permisos);
    END IF;
    
    -- Insert default settings using profile id
    INSERT INTO public.settings (user_id)
    VALUES (new_profile_id);
  END IF;
  
  RETURN NEW;
END;
$function$;