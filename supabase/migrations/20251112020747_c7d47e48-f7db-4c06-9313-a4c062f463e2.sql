-- Ensure helper function exists and is security definer
CREATE OR REPLACE FUNCTION public.get_profile_id_from_auth()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Ensure created_by is set server-side for new conversaciones
ALTER TABLE public.conversaciones
ALTER COLUMN created_by SET DEFAULT public.get_profile_id_from_auth();

-- Trigger to force created_by to the caller's profile id
CREATE OR REPLACE FUNCTION public.set_conversacion_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := public.get_profile_id_from_auth();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_conversacion_creator ON public.conversaciones;
CREATE TRIGGER set_conversacion_creator
BEFORE INSERT ON public.conversaciones
FOR EACH ROW
EXECUTE FUNCTION public.set_conversacion_creator();

-- Update INSERT policy to align with server-side assignment
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON public.conversaciones;
CREATE POLICY "Usuarios pueden crear conversaciones"
ON public.conversaciones
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = public.get_profile_id_from_auth()
);

-- Ensure creator can read the conversation immediately after insert
DROP POLICY IF EXISTS "Creador puede ver su conversación" ON public.conversaciones;
CREATE POLICY "Creador puede ver su conversación"
ON public.conversaciones
FOR SELECT
TO authenticated
USING (created_by = public.get_profile_id_from_auth());