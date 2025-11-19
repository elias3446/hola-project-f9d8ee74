-- Crear tabla para historial de cambios en grupos
CREATE TABLE IF NOT EXISTS public.group_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('member_added', 'member_removed', 'member_promoted', 'member_demoted', 'group_created', 'group_renamed')),
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  affected_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_group_history_conversacion ON public.group_history(conversacion_id);
CREATE INDEX idx_group_history_created_at ON public.group_history(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.group_history ENABLE ROW LEVEL SECURITY;

-- Política: Los participantes del grupo pueden ver el historial
CREATE POLICY "Participants can view group history"
ON public.group_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.participantes_conversacion
    WHERE participantes_conversacion.conversacion_id = group_history.conversacion_id
    AND participantes_conversacion.user_id = get_profile_id_from_auth()
    AND participantes_conversacion.hidden_at IS NULL
  )
);

-- Política: El sistema puede insertar historial
CREATE POLICY "System can insert group history"
ON public.group_history
FOR INSERT
WITH CHECK (true);