-- Add support for reposting (sharing posts within the social network)
-- Add a column to track if a post is a repost of another post
ALTER TABLE public.publicaciones
ADD COLUMN repost_of uuid REFERENCES public.publicaciones(id) ON DELETE CASCADE;

-- Add a column for the user's comment when reposting
ALTER TABLE public.publicaciones
ADD COLUMN repost_comentario text;

-- Create an index for faster queries on reposts
CREATE INDEX idx_publicaciones_repost_of ON public.publicaciones(repost_of) WHERE repost_of IS NOT NULL;

-- Add a comment explaining the columns
COMMENT ON COLUMN public.publicaciones.repost_of IS 'Reference to the original post if this is a repost';
COMMENT ON COLUMN public.publicaciones.repost_comentario IS 'Optional comment added by the user when reposting';