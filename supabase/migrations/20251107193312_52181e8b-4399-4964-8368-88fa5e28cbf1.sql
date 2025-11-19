-- Asegurar que las tablas tengan REPLICA IDENTITY FULL para cambios en tiempo real
ALTER TABLE IF EXISTS interacciones REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS publicacion_vistas REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS comentarios REPLICA IDENTITY FULL;

-- Asegurar que las tablas estén en la publicación realtime
DO $$ 
BEGIN
  -- Agregar interacciones a publicación realtime si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'interacciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE interacciones;
  END IF;

  -- Agregar publicacion_vistas a publicación realtime si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'publicacion_vistas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE publicacion_vistas;
  END IF;

  -- Agregar comentarios a publicación realtime si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'comentarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comentarios;
  END IF;
END $$;