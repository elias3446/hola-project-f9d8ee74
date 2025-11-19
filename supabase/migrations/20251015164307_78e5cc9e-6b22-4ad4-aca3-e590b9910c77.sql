-- Primero, modificar la función set_assigned_by para obtener el profile_id correcto
CREATE OR REPLACE FUNCTION public.set_assigned_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_profile_id uuid;
BEGIN
  -- Obtener el profile_id del usuario autenticado
  SELECT id INTO current_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Establecer assigned_by al profile_id del usuario actual
  IF current_profile_id IS NOT NULL THEN
    NEW.assigned_by := current_profile_id;
    NEW.assigned_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para INSERT en user_roles
DROP TRIGGER IF EXISTS set_user_roles_assigned_by_on_insert ON public.user_roles;
CREATE TRIGGER set_user_roles_assigned_by_on_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assigned_by();

-- Crear trigger para UPDATE en user_roles
DROP TRIGGER IF EXISTS set_user_roles_assigned_by_on_update ON public.user_roles;
CREATE TRIGGER set_user_roles_assigned_by_on_update
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assigned_by();