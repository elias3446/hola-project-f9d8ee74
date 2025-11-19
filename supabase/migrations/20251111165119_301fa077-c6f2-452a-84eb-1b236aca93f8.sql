-- Add muted and hidden_at columns to participantes_conversacion table
-- These columns enable muting conversations and soft-deleting them

-- Add muted column for silencing conversations
ALTER TABLE participantes_conversacion 
ADD COLUMN IF NOT EXISTS muted boolean DEFAULT false;

-- Add hidden_at column for soft deleting conversations
ALTER TABLE participantes_conversacion 
ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- Create index for better performance on hidden conversations query
CREATE INDEX IF NOT EXISTS idx_participantes_hidden 
ON participantes_conversacion(user_id, hidden_at) 
WHERE hidden_at IS NULL;

-- Create index for muted conversations
CREATE INDEX IF NOT EXISTS idx_participantes_muted 
ON participantes_conversacion(user_id, muted);

-- Add comments for documentation
COMMENT ON COLUMN participantes_conversacion.muted IS 'Whether the user has muted this conversation';
COMMENT ON COLUMN participantes_conversacion.hidden_at IS 'Timestamp when the user deleted/hid this conversation';