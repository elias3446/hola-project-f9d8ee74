-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  uso_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create many-to-many relationship table
CREATE TABLE IF NOT EXISTS public.publicacion_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(publicacion_id, hashtag_id)
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicacion_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hashtags
CREATE POLICY "Anyone can view hashtags"
  ON public.hashtags
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert hashtags"
  ON public.hashtags
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update hashtags"
  ON public.hashtags
  FOR UPDATE
  USING (true);

-- RLS Policies for publicacion_hashtags
CREATE POLICY "Anyone can view publicacion_hashtags"
  ON public.publicacion_hashtags
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert hashtags for their posts"
  ON public.publicacion_hashtags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM publicaciones
      WHERE publicaciones.id = publicacion_id
      AND publicaciones.user_id = get_profile_id_from_auth()
    )
  );

CREATE POLICY "Users can delete hashtags from their posts"
  ON public.publicacion_hashtags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM publicaciones
      WHERE publicaciones.id = publicacion_id
      AND publicaciones.user_id = get_profile_id_from_auth()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_hashtags_nombre ON public.hashtags(nombre);
CREATE INDEX idx_hashtags_uso_count ON public.hashtags(uso_count DESC);
CREATE INDEX idx_publicacion_hashtags_publicacion ON public.publicacion_hashtags(publicacion_id);
CREATE INDEX idx_publicacion_hashtags_hashtag ON public.publicacion_hashtags(hashtag_id);

-- Function to update hashtag count
CREATE OR REPLACE FUNCTION update_hashtag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags 
    SET uso_count = uso_count + 1, updated_at = now()
    WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags 
    SET uso_count = GREATEST(uso_count - 1, 0), updated_at = now()
    WHERE id = OLD.hashtag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update hashtag count
CREATE TRIGGER trigger_update_hashtag_count
AFTER INSERT OR DELETE ON public.publicacion_hashtags
FOR EACH ROW
EXECUTE FUNCTION update_hashtag_count();

-- Enable realtime for hashtags
ALTER PUBLICATION supabase_realtime ADD TABLE hashtags;
ALTER PUBLICATION supabase_realtime ADD TABLE publicacion_hashtags;