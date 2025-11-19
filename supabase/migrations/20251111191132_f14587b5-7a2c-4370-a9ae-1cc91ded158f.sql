-- Crear tabla para reacciones de mensajes
CREATE TABLE IF NOT EXISTS public.mensaje_reacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES public.mensajes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(mensaje_id, user_id, emoji)
);

-- Habilitar RLS
ALTER TABLE public.mensaje_reacciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Usuarios pueden ver reacciones de mensajes que pueden ver"
  ON public.mensaje_reacciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mensajes m
      INNER JOIN public.participantes_conversacion pc 
        ON pc.conversacion_id = m.conversacion_id
      WHERE m.id = mensaje_reacciones.mensaje_id
        AND pc.user_id = get_profile_id_from_auth()
        AND pc.hidden_at IS NULL
    )
  );

CREATE POLICY "Usuarios pueden añadir reacciones"
  ON public.mensaje_reacciones
  FOR INSERT
  WITH CHECK (
    get_profile_id_from_auth() = user_id
    AND EXISTS (
      SELECT 1 FROM public.mensajes m
      INNER JOIN public.participantes_conversacion pc 
        ON pc.conversacion_id = m.conversacion_id
      WHERE m.id = mensaje_reacciones.mensaje_id
        AND pc.user_id = get_profile_id_from_auth()
        AND pc.hidden_at IS NULL
    )
  );

CREATE POLICY "Usuarios pueden eliminar sus propias reacciones"
  ON public.mensaje_reacciones
  FOR DELETE
  USING (get_profile_id_from_auth() = user_id);

-- Índices para mejorar rendimiento
CREATE INDEX idx_mensaje_reacciones_mensaje_id ON public.mensaje_reacciones(mensaje_id);
CREATE INDEX idx_mensaje_reacciones_user_id ON public.mensaje_reacciones(user_id);
CREATE INDEX idx_mensaje_reacciones_emoji ON public.mensaje_reacciones(emoji);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensaje_reacciones;