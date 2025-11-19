-- Create publicacion_compartidos table to track shares
CREATE TABLE public.publicacion_compartidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo_compartido TEXT NOT NULL CHECK (tipo_compartido IN ('enlace', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'interno')),
  destinatario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publicacion_compartidos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view share counts
CREATE POLICY "Usuarios pueden ver compartidos"
ON public.publicacion_compartidos
FOR SELECT
USING (true);

-- Policy: Users can register their own shares
CREATE POLICY "Usuarios pueden registrar compartidos"
ON public.publicacion_compartidos
FOR INSERT
WITH CHECK (
  get_profile_id_from_auth() = user_id
);

-- Create index for better performance
CREATE INDEX idx_publicacion_compartidos_publicacion_id 
ON public.publicacion_compartidos(publicacion_id);

CREATE INDEX idx_publicacion_compartidos_user_id 
ON public.publicacion_compartidos(user_id);

-- Add comment
COMMENT ON TABLE public.publicacion_compartidos IS 'Tracks how posts are shared by users';
