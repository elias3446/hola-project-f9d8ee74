-- Add role column to participantes_conversacion
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_role') THEN
    CREATE TYPE conversation_role AS ENUM ('miembro', 'administrador');
  END IF;
END $$;

ALTER TABLE participantes_conversacion 
ADD COLUMN IF NOT EXISTS role conversation_role NOT NULL DEFAULT 'miembro';

-- Update creator role to administrador for existing conversations
UPDATE participantes_conversacion pc
SET role = 'administrador'
WHERE user_id IN (
  SELECT created_by 
  FROM conversaciones c 
  WHERE c.id = pc.conversacion_id AND c.es_grupo = true
);

-- Create function to check if user is admin in conversation
CREATE OR REPLACE FUNCTION is_conversation_admin(conv_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM participantes_conversacion
    WHERE conversacion_id = conv_id
      AND user_id = user_id_param
      AND role = 'administrador'
      AND hidden_at IS NULL
  )
$$;