-- Tabla para que usuarios sigan hashtags
CREATE TABLE IF NOT EXISTS public.user_hashtag_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, hashtag_id)
);

-- Habilitar RLS
ALTER TABLE public.user_hashtag_follows ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own hashtag follows"
ON public.user_hashtag_follows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hashtag follows"
ON public.user_hashtag_follows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hashtag follows"
ON public.user_hashtag_follows
FOR DELETE
USING (auth.uid() = user_id);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_hashtag_follows_user_id ON public.user_hashtag_follows(user_id);
CREATE INDEX idx_user_hashtag_follows_hashtag_id ON public.user_hashtag_follows(hashtag_id);

-- Función para crear notificaciones cuando un hashtag seguido se vuelve trending
CREATE OR REPLACE FUNCTION public.notify_trending_hashtag()
RETURNS TRIGGER AS $$
DECLARE
  trending_threshold INTEGER := 5; -- Umbral para considerar trending
BEGIN
  -- Si el hashtag cruza el umbral de trending
  IF NEW.uso_count >= trending_threshold AND (OLD.uso_count IS NULL OR OLD.uso_count < trending_threshold) THEN
    -- Crear notificaciones para todos los usuarios que siguen este hashtag
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      uhf.user_id,
      '🔥 Hashtag en Tendencia',
      CONCAT('#', NEW.nombre, ' está en tendencia con ', NEW.uso_count, ' publicaciones'),
      'hashtag_trending',
      NEW.id::TEXT
    FROM public.user_hashtag_follows uhf
    WHERE uhf.hashtag_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se actualiza uso_count
CREATE TRIGGER trigger_notify_trending_hashtag
AFTER UPDATE OF uso_count ON public.hashtags
FOR EACH ROW
EXECUTE FUNCTION public.notify_trending_hashtag();

-- Habilitar realtime para user_hashtag_follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_hashtag_follows;