-- Habilitar replica identity para participantes_conversacion
ALTER TABLE participantes_conversacion REPLICA IDENTITY FULL;

-- Agregar a la publicación de realtime si no está
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'participantes_conversacion'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participantes_conversacion;
  END IF;
END $$;