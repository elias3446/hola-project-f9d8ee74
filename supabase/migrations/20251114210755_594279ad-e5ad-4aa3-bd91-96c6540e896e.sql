-- Create estados table for WhatsApp-like stories
CREATE TABLE IF NOT EXISTS public.estados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contenido TEXT,
  imagenes TEXT[] DEFAULT '{}',
  tipo TEXT NOT NULL DEFAULT 'imagen' CHECK (tipo IN ('imagen', 'texto', 'video')),
  compartido_en_mensajes BOOLEAN DEFAULT false,
  compartido_en_social BOOLEAN DEFAULT false,
  visibilidad TEXT NOT NULL DEFAULT 'todos' CHECK (visibilidad IN ('todos', 'contactos', 'privado')),
  vistas JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  activo BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;

-- Users can create their own estados
CREATE POLICY "Users can create their own estados"
  ON public.estados
  FOR INSERT
  WITH CHECK (get_profile_id_from_auth() = user_id);

-- Users can view estados based on visibility
CREATE POLICY "Users can view estados"
  ON public.estados
  FOR SELECT
  USING (
    activo = true 
    AND expires_at > now()
    AND (
      visibilidad = 'todos'
      OR (visibilidad = 'contactos' AND EXISTS (
        SELECT 1 FROM relaciones 
        WHERE (relaciones.user_id = estados.user_id AND relaciones.seguidor_id = get_profile_id_from_auth() AND relaciones.estado = 'aceptado')
        OR (relaciones.seguidor_id = estados.user_id AND relaciones.user_id = get_profile_id_from_auth() AND relaciones.estado = 'aceptado')
      ))
      OR user_id = get_profile_id_from_auth()
    )
  );

-- Users can update their own estados
CREATE POLICY "Users can update their own estados"
  ON public.estados
  FOR UPDATE
  USING (get_profile_id_from_auth() = user_id)
  WITH CHECK (get_profile_id_from_auth() = user_id);

-- Users can delete their own estados
CREATE POLICY "Users can delete their own estados"
  ON public.estados
  FOR DELETE
  USING (get_profile_id_from_auth() = user_id);

-- Create index for better performance
CREATE INDEX idx_estados_user_id ON public.estados(user_id);
CREATE INDEX idx_estados_expires_at ON public.estados(expires_at);
CREATE INDEX idx_estados_activo ON public.estados(activo);

-- Function to automatically clean up expired estados
CREATE OR REPLACE FUNCTION cleanup_expired_estados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.estados
  SET activo = false
  WHERE expires_at <= now() AND activo = true;
END;
$$;