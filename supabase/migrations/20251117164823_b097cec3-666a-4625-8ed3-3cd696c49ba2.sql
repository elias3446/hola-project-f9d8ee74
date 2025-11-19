-- Fix RLS policies for estado_vistas to use profile ids, not auth.uid directly
ALTER TABLE public.estado_vistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden registrar vistas" ON public.estado_vistas;
CREATE POLICY "Los usuarios pueden registrar vistas"
ON public.estado_vistas
FOR INSERT
WITH CHECK (get_profile_id_from_auth() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden ver las vistas de sus propios estados" ON public.estado_vistas;
CREATE POLICY "Los usuarios pueden ver las vistas de sus propios estados"
ON public.estado_vistas
FOR SELECT
USING (
  estado_id IN (
    SELECT e.id
    FROM public.estados e
    WHERE e.user_id = get_profile_id_from_auth()
  )
);
