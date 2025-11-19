-- Crear tabla de vistas de estados
CREATE TABLE IF NOT EXISTS public.estado_vistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estado_id UUID NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(estado_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.estado_vistas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden registrar vistas"
  ON public.estado_vistas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden ver las vistas de sus propios estados"
  ON public.estado_vistas
  FOR SELECT
  USING (
    estado_id IN (
      SELECT id FROM public.estados WHERE user_id = auth.uid()
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX idx_estado_vistas_estado_id ON public.estado_vistas(estado_id);
CREATE INDEX idx_estado_vistas_user_id ON public.estado_vistas(user_id);
CREATE INDEX idx_estado_vistas_created_at ON public.estado_vistas(created_at DESC);