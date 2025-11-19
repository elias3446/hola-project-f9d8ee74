-- Crear tabla para reacciones de estados
CREATE TABLE public.estado_reacciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estado_id UUID NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(estado_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.estado_reacciones ENABLE ROW LEVEL SECURITY;

-- Política para ver reacciones de estados que pueden ver
CREATE POLICY "Users can view reactions on estados they can view"
ON public.estado_reacciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estados
    WHERE estados.id = estado_reacciones.estado_id
    AND estados.activo = true
    AND estados.expires_at > now()
    AND (
      estados.visibilidad = 'todos'
      OR (estados.visibilidad = 'contactos' AND EXISTS (
        SELECT 1 FROM public.relaciones
        WHERE (
          (relaciones.user_id = estados.user_id AND relaciones.seguidor_id = get_profile_id_from_auth() AND relaciones.estado = 'aceptado')
          OR (relaciones.seguidor_id = estados.user_id AND relaciones.user_id = get_profile_id_from_auth() AND relaciones.estado = 'aceptado')
        )
      ))
      OR estados.user_id = get_profile_id_from_auth()
    )
  )
);

-- Política para crear reacciones
CREATE POLICY "Users can create their own reactions"
ON public.estado_reacciones
FOR INSERT
WITH CHECK (get_profile_id_from_auth() = user_id);

-- Política para eliminar reacciones propias
CREATE POLICY "Users can delete their own reactions"
ON public.estado_reacciones
FOR DELETE
USING (get_profile_id_from_auth() = user_id);

-- Índices para mejor rendimiento
CREATE INDEX idx_estado_reacciones_estado_id ON public.estado_reacciones(estado_id);
CREATE INDEX idx_estado_reacciones_user_id ON public.estado_reacciones(user_id);