-- Migrate social features tables to use profile IDs consistently
-- This fixes the security issue where auth.uid() is exposed directly

-- Step 1: Drop ALL policies that reference user_id (including cross-table references)
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Usuarios pueden crear comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Usuarios pueden ver comentarios de publicaciones que pueden ver" ON public.comentarios;

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propias publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver publicaciones de amigos" ON public.publicaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver publicaciones públicas" ON public.publicaciones;

DROP POLICY IF EXISTS "Usuarios pueden actualizar relaciones donde están involucrados" ON public.relaciones;
DROP POLICY IF EXISTS "Usuarios pueden crear relaciones" ON public.relaciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias relaciones" ON public.relaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver sus relaciones" ON public.relaciones;

DROP POLICY IF EXISTS "Participantes pueden enviar mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Participantes pueden ver mensajes de conversaciones activas" ON public.mensajes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios mensajes" ON public.mensajes;

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias interacciones" ON public.interacciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias interacciones" ON public.interacciones;
DROP POLICY IF EXISTS "Usuarios pueden ver interacciones" ON public.interacciones;

DROP POLICY IF EXISTS "Participantes pueden ver participantes activos" ON public.participantes_conversacion;
DROP POLICY IF EXISTS "Usuarios pueden abandonar conversaciones" ON public.participantes_conversacion;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su participación" ON public.participantes_conversacion;
DROP POLICY IF EXISTS "Usuarios pueden ocultar conversaciones" ON public.participantes_conversacion;
DROP POLICY IF EXISTS "Usuarios pueden unirse a conversaciones" ON public.participantes_conversacion;

-- Drop conversaciones policies that reference participantes_conversacion.user_id
DROP POLICY IF EXISTS "Participantes pueden actualizar conversaciones" ON public.conversaciones;
DROP POLICY IF EXISTS "Participantes pueden ver conversaciones activas" ON public.conversaciones;
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON public.conversaciones;

-- Step 2: Add temporary profile_id columns
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.relaciones ADD COLUMN IF NOT EXISTS seguidor_profile_id uuid;
ALTER TABLE public.relaciones ADD COLUMN IF NOT EXISTS user_profile_id uuid;
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.interacciones ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.participantes_conversacion ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Step 3: Migrate existing data from auth user_ids to profile ids
UPDATE public.comentarios c
SET profile_id = p.id
FROM public.profiles p
WHERE p.user_id = c.user_id;

UPDATE public.publicaciones pub
SET profile_id = p.id
FROM public.profiles p
WHERE p.user_id = pub.user_id;

UPDATE public.relaciones r
SET seguidor_profile_id = p.id
FROM public.profiles p
WHERE p.user_id = r.seguidor_id;

UPDATE public.relaciones r
SET user_profile_id = p.id
FROM public.profiles p
WHERE p.user_id = r.user_id;

UPDATE public.mensajes m
SET profile_id = p.id
FROM public.profiles p
WHERE p.user_id = m.user_id;

UPDATE public.interacciones i
SET profile_id = p.id
FROM public.profiles p
WHERE p.user_id = i.user_id;

UPDATE public.participantes_conversacion pc
SET profile_id = p.id
FROM public.profiles p
WHERE p.user_id = pc.user_id;

-- Step 4: Drop old columns and rename new ones
ALTER TABLE public.comentarios DROP COLUMN user_id;
ALTER TABLE public.comentarios RENAME COLUMN profile_id TO user_id;

ALTER TABLE public.publicaciones DROP COLUMN user_id;
ALTER TABLE public.publicaciones RENAME COLUMN profile_id TO user_id;

ALTER TABLE public.relaciones DROP COLUMN seguidor_id;
ALTER TABLE public.relaciones RENAME COLUMN seguidor_profile_id TO seguidor_id;
ALTER TABLE public.relaciones DROP COLUMN user_id;
ALTER TABLE public.relaciones RENAME COLUMN user_profile_id TO user_id;

ALTER TABLE public.mensajes DROP COLUMN user_id;
ALTER TABLE public.mensajes RENAME COLUMN profile_id TO user_id;

ALTER TABLE public.interacciones DROP COLUMN user_id;
ALTER TABLE public.interacciones RENAME COLUMN profile_id TO user_id;

ALTER TABLE public.participantes_conversacion DROP COLUMN user_id;
ALTER TABLE public.participantes_conversacion RENAME COLUMN profile_id TO user_id;

-- Step 5: Add foreign key constraints to profiles table
ALTER TABLE public.comentarios 
ADD CONSTRAINT comentarios_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.publicaciones 
ADD CONSTRAINT publicaciones_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.relaciones 
ADD CONSTRAINT relaciones_seguidor_id_fkey 
FOREIGN KEY (seguidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.relaciones 
ADD CONSTRAINT relaciones_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mensajes 
ADD CONSTRAINT mensajes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.interacciones 
ADD CONSTRAINT interacciones_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.participantes_conversacion 
ADD CONSTRAINT participantes_conversacion_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 6: Recreate all policies using get_profile_id_from_auth()
-- COMENTARIOS
CREATE POLICY "Usuarios pueden actualizar sus propios comentarios"
ON public.comentarios FOR UPDATE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden crear comentarios"
ON public.comentarios FOR INSERT TO authenticated
WITH CHECK (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios comentarios"
ON public.comentarios FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden ver comentarios de publicaciones que pueden ver"
ON public.comentarios FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.publicaciones
    WHERE publicaciones.id = comentarios.publicacion_id
    AND (
      publicaciones.visibilidad = 'publico'
      OR publicaciones.user_id = get_profile_id_from_auth()
      OR (
        publicaciones.visibilidad = 'amigos'
        AND EXISTS (
          SELECT 1 FROM public.relaciones
          WHERE relaciones.user_id = publicaciones.user_id
          AND relaciones.seguidor_id = get_profile_id_from_auth()
          AND relaciones.estado = 'aceptado'
        )
      )
    )
  )
);

-- PUBLICACIONES
CREATE POLICY "Usuarios pueden actualizar sus propias publicaciones"
ON public.publicaciones FOR UPDATE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias publicaciones"
ON public.publicaciones FOR INSERT TO authenticated
WITH CHECK (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias publicaciones"
ON public.publicaciones FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden ver publicaciones públicas o propias"
ON public.publicaciones FOR SELECT TO authenticated
USING (visibilidad = 'publico' OR get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden ver publicaciones de amigos"
ON public.publicaciones FOR SELECT TO authenticated
USING (
  visibilidad = 'amigos' AND (
    get_profile_id_from_auth() = user_id
    OR EXISTS (
      SELECT 1 FROM public.relaciones
      WHERE relaciones.user_id = publicaciones.user_id
      AND relaciones.seguidor_id = get_profile_id_from_auth()
      AND relaciones.estado = 'aceptado'
    )
  )
);

-- RELACIONES
CREATE POLICY "Usuarios pueden actualizar relaciones donde están involucrados"
ON public.relaciones FOR UPDATE TO authenticated
USING (get_profile_id_from_auth() = user_id OR get_profile_id_from_auth() = seguidor_id);

CREATE POLICY "Usuarios pueden crear relaciones"
ON public.relaciones FOR INSERT TO authenticated
WITH CHECK (get_profile_id_from_auth() = seguidor_id);

CREATE POLICY "Usuarios pueden eliminar sus propias relaciones"
ON public.relaciones FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = seguidor_id);

CREATE POLICY "Usuarios pueden ver sus relaciones"
ON public.relaciones FOR SELECT TO authenticated
USING (get_profile_id_from_auth() = user_id OR get_profile_id_from_auth() = seguidor_id);

-- MENSAJES
CREATE POLICY "Participantes pueden enviar mensajes"
ON public.mensajes FOR INSERT TO authenticated
WITH CHECK (
  get_profile_id_from_auth() = user_id
  AND EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = mensajes.conversacion_id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
  )
);

CREATE POLICY "Participantes pueden ver mensajes de conversaciones activas"
ON public.mensajes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = mensajes.conversacion_id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
    AND participantes_conversacion.hidden_at IS NULL
  )
);

CREATE POLICY "Usuarios pueden actualizar sus propios mensajes"
ON public.mensajes FOR UPDATE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios mensajes"
ON public.mensajes FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = user_id);

-- INTERACCIONES
CREATE POLICY "Usuarios pueden crear sus propias interacciones"
ON public.interacciones FOR INSERT TO authenticated
WITH CHECK (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias interacciones"
ON public.interacciones FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden ver interacciones"
ON public.interacciones FOR SELECT TO authenticated
USING (true);

-- PARTICIPANTES_CONVERSACION
CREATE POLICY "Participantes pueden ver participantes activos"
ON public.participantes_conversacion FOR SELECT TO authenticated
USING (
  is_conversation_participant(conversacion_id, get_profile_id_from_auth())
  AND hidden_at IS NULL
);

CREATE POLICY "Usuarios pueden abandonar conversaciones"
ON public.participantes_conversacion FOR DELETE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden actualizar su participación"
ON public.participantes_conversacion FOR UPDATE TO authenticated
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Usuarios pueden unirse a conversaciones"
ON public.participantes_conversacion FOR INSERT TO authenticated
WITH CHECK (true);

-- CONVERSACIONES (recreate policies)
CREATE POLICY "Participantes pueden actualizar conversaciones"
ON public.conversaciones FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = conversaciones.id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
  )
);

CREATE POLICY "Participantes pueden ver conversaciones activas"
ON public.conversaciones FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = conversaciones.id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
    AND participantes_conversacion.hidden_at IS NULL
  )
);

CREATE POLICY "Usuarios pueden crear conversaciones"
ON public.conversaciones FOR INSERT TO authenticated
WITH CHECK (true);

-- Step 7: Update is_conversation_participant function
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE conversacion_id = _conversation_id AND user_id = _user_id
  )
$function$;