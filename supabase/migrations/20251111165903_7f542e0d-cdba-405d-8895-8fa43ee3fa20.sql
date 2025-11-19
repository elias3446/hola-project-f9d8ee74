-- Add muted column to participantes_conversacion table
ALTER TABLE public.participantes_conversacion 
ADD COLUMN IF NOT EXISTS muted BOOLEAN NOT NULL DEFAULT false;