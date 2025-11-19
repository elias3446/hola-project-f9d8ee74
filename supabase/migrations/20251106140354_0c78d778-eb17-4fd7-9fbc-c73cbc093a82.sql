-- Add images column to comentarios table
ALTER TABLE comentarios 
ADD COLUMN IF NOT EXISTS imagenes text[] DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN comentarios.imagenes IS 'Array of image URLs attached to the comment';