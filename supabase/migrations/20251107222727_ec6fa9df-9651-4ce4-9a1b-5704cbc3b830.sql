-- Create table for saved posts
CREATE TABLE public.publicacion_guardadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  publicacion_id UUID REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, publicacion_id)
);

-- Enable Row Level Security
ALTER TABLE public.publicacion_guardadas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved posts"
ON public.publicacion_guardadas
FOR SELECT
USING (get_profile_id_from_auth() = user_id);

CREATE POLICY "Users can save posts"
ON public.publicacion_guardadas
FOR INSERT
WITH CHECK (get_profile_id_from_auth() = user_id);

CREATE POLICY "Users can unsave their posts"
ON public.publicacion_guardadas
FOR DELETE
USING (get_profile_id_from_auth() = user_id);

-- Create index for better performance
CREATE INDEX idx_publicacion_guardadas_user_id ON public.publicacion_guardadas(user_id);
CREATE INDEX idx_publicacion_guardadas_publicacion_id ON public.publicacion_guardadas(publicacion_id);