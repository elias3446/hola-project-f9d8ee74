-- Add field to track if user must change password after first login
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean DEFAULT false;

-- Add field to track if temporary password has been used
ALTER TABLE public.profiles 
ADD COLUMN temp_password_used boolean DEFAULT false;

-- Create function to clear temporary password from metadata after first password change
CREATE OR REPLACE FUNCTION public.clear_temp_password_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is changing password and temp_password_used is false, mark it as used
  IF NEW.must_change_password = false AND OLD.must_change_password = true THEN
    -- Mark that temporary password has been used
    NEW.temp_password_used = true;
    
    -- Clear the password from user metadata
    -- Note: This requires admin privileges which SECURITY DEFINER provides
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data - 'password'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to clear temp password after first change
CREATE TRIGGER on_password_change_clear_metadata
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.must_change_password IS DISTINCT FROM NEW.must_change_password)
  EXECUTE FUNCTION public.clear_temp_password_metadata();

-- Update handle_new_user to set must_change_password for admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
  _roles user_role[];
  _permisos user_permission[];
  _creator_profile_id uuid;
  _existing_profile_id uuid;
  _is_admin_created boolean;
BEGIN
  -- Check if this is an existing profile being reconnected
  _existing_profile_id := (NEW.raw_user_meta_data->>'existing_profile_id')::uuid;
  
  IF _existing_profile_id IS NOT NULL THEN
    -- Reconnect existing profile to new user
    UPDATE profiles
    SET user_id = NEW.id,
        email = NEW.email,
        updated_at = now()
    WHERE id = _existing_profile_id;
    
    RETURN NEW;
  END IF;

  -- Get roles and permissions from metadata
  _roles := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles'))::user_role[],
    ARRAY['usuario_regular']::user_role[]
  );
  
  _permisos := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permisos'))::user_permission[],
    ARRAY['ver_reporte', 'crear_reporte']::user_permission[]
  );

  _creator_profile_id := (NEW.raw_user_meta_data->>'creator_profile_id')::uuid;
  
  -- Determine if this user was created by an admin (has creator_profile_id and password in metadata)
  _is_admin_created := _creator_profile_id IS NOT NULL AND (NEW.raw_user_meta_data->>'password') IS NOT NULL;

  -- Insert into profiles with must_change_password set for admin-created users
  INSERT INTO profiles (user_id, email, name, confirmed, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    _is_admin_created  -- Set to true if created by admin with temp password
  )
  RETURNING id INTO _profile_id;

  -- Insert roles
  INSERT INTO user_roles (user_id, roles, permisos)
  VALUES (_profile_id, _roles, _permisos);

  -- Register in audit log
  INSERT INTO user_audit (
    user_id,
    action,
    details,
    performed_by
  ) VALUES (
    _profile_id,
    'user_created',
    jsonb_build_object(
      'email', NEW.email,
      'name', NEW.raw_user_meta_data->>'name',
      'roles', _roles,
      'created_by_admin', _is_admin_created
    ),
    COALESCE(_creator_profile_id, _profile_id)
  );

  RETURN NEW;
END;
$$;

COMMENT ON COLUMN profiles.must_change_password IS 'Indicates if user must change password on next login (for admin-created accounts with temporary passwords)';
COMMENT ON COLUMN profiles.temp_password_used IS 'Tracks if the temporary password from metadata has been changed';
COMMENT ON FUNCTION clear_temp_password_metadata() IS 'Removes temporary password from auth metadata after user changes it for the first time';