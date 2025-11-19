-- Crear bucket para imágenes de mensajes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mensajes', 'mensajes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para permitir que usuarios suban imágenes a sus propias carpetas
CREATE POLICY "Usuarios pueden subir sus propias imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mensajes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para permitir ver imágenes de conversaciones donde son participantes
CREATE POLICY "Participantes pueden ver imágenes de mensajes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mensajes' AND
  EXISTS (
    SELECT 1 FROM mensajes m
    JOIN participantes_conversacion pc ON pc.conversacion_id = m.conversacion_id
    WHERE m.imagenes @> ARRAY[storage.objects.name]
    AND pc.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Políticas para permitir actualizar sus propias imágenes
CREATE POLICY "Usuarios pueden actualizar sus propias imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mensajes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para permitir eliminar sus propias imágenes
CREATE POLICY "Usuarios pueden eliminar sus propias imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mensajes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);