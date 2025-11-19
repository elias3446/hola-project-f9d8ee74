-- Create table for post mentions
CREATE TABLE IF NOT EXISTS publicacion_menciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(publicacion_id, mentioned_user_id)
);

-- Create table for comment mentions
CREATE TABLE IF NOT EXISTS comentario_menciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comentario_id UUID NOT NULL REFERENCES comentarios(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comentario_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE publicacion_menciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario_menciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for publicacion_menciones
CREATE POLICY "Anyone can view post mentions"
  ON publicacion_menciones FOR SELECT
  USING (true);

CREATE POLICY "Users can create mentions in their posts"
  ON publicacion_menciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM publicaciones
      WHERE publicaciones.id = publicacion_menciones.publicacion_id
      AND publicaciones.user_id = get_profile_id_from_auth()
    )
  );

CREATE POLICY "Users can delete mentions from their posts"
  ON publicacion_menciones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM publicaciones
      WHERE publicaciones.id = publicacion_menciones.publicacion_id
      AND publicaciones.user_id = get_profile_id_from_auth()
    )
  );

-- RLS Policies for comentario_menciones
CREATE POLICY "Anyone can view comment mentions"
  ON comentario_menciones FOR SELECT
  USING (true);

CREATE POLICY "Users can create mentions in their comments"
  ON comentario_menciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comentarios
      WHERE comentarios.id = comentario_menciones.comentario_id
      AND comentarios.user_id = get_profile_id_from_auth()
    )
  );

CREATE POLICY "Users can delete mentions from their comments"
  ON comentario_menciones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM comentarios
      WHERE comentarios.id = comentario_menciones.comentario_id
      AND comentarios.user_id = get_profile_id_from_auth()
    )
  );

-- Function to create notification when mentioned in a post
CREATE OR REPLACE FUNCTION notify_post_mention()
RETURNS TRIGGER AS $$
DECLARE
  v_author_name TEXT;
  v_post_content TEXT;
BEGIN
  -- Get author name and post content
  SELECT p.name, pub.contenido
  INTO v_author_name, v_post_content
  FROM publicaciones pub
  JOIN profiles p ON p.id = pub.user_id
  WHERE pub.id = NEW.publicacion_id;

  -- Create notification for mentioned user (only if not mentioning themselves)
  IF NEW.mentioned_user_id != (SELECT user_id FROM publicaciones WHERE id = NEW.publicacion_id) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.mentioned_user_id,
      'mencion',
      'Te mencionaron en una publicación',
      v_author_name || ' te mencionó en una publicación',
      jsonb_build_object(
        'publicacion_id', NEW.publicacion_id,
        'author_name', v_author_name,
        'content_preview', LEFT(v_post_content, 100)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when mentioned in a comment
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
  v_author_name TEXT;
  v_comment_content TEXT;
  v_publicacion_id UUID;
BEGIN
  -- Get author name, comment content, and post id
  SELECT p.name, c.contenido, c.publicacion_id
  INTO v_author_name, v_comment_content, v_publicacion_id
  FROM comentarios c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.id = NEW.comentario_id;

  -- Create notification for mentioned user (only if not mentioning themselves)
  IF NEW.mentioned_user_id != (SELECT user_id FROM comentarios WHERE id = NEW.comentario_id) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.mentioned_user_id,
      'mencion',
      'Te mencionaron en un comentario',
      v_author_name || ' te mencionó en un comentario',
      jsonb_build_object(
        'comentario_id', NEW.comentario_id,
        'publicacion_id', v_publicacion_id,
        'author_name', v_author_name,
        'content_preview', LEFT(v_comment_content, 100)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_post_mention_created
  AFTER INSERT ON publicacion_menciones
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_mention();

CREATE TRIGGER on_comment_mention_created
  AFTER INSERT ON comentario_menciones
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mention();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_publicacion_menciones_user ON publicacion_menciones(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_comentario_menciones_user ON comentario_menciones(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_publicacion_menciones_post ON publicacion_menciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentario_menciones_comment ON comentario_menciones(comentario_id);