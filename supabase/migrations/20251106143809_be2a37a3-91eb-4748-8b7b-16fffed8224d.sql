-- Create views table to track post views
CREATE TABLE IF NOT EXISTS public.publicacion_vistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure one view per user per post
  UNIQUE(publicacion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.publicacion_vistas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create views
CREATE POLICY "Usuarios pueden registrar vistas"
ON public.publicacion_vistas
FOR INSERT
WITH CHECK (get_profile_id_from_auth() = user_id);

-- Policy: Users can see view counts
CREATE POLICY "Usuarios pueden ver contadores de vistas"
ON public.publicacion_vistas
FOR SELECT
USING (true);

-- Create index for better performance
CREATE INDEX idx_publicacion_vistas_publicacion ON public.publicacion_vistas(publicacion_id);
CREATE INDEX idx_publicacion_vistas_user ON public.publicacion_vistas(user_id);

-- Enable realtime for views
ALTER TABLE public.publicacion_vistas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publicacion_vistas;