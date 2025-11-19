-- Agregar columna registro_id a la tabla user_audit para registrar el ID del registro afectado
-- Esta columna almacenará el UUID del registro específico que fue modificado

ALTER TABLE public.user_audit
ADD COLUMN IF NOT EXISTS registro_id UUID;

-- Agregar índice para mejorar el rendimiento de búsquedas por registro_id
CREATE INDEX IF NOT EXISTS idx_user_audit_registro_id ON public.user_audit(registro_id);

-- Agregar índice compuesto para búsquedas por tabla y registro
CREATE INDEX IF NOT EXISTS idx_user_audit_tabla_registro ON public.user_audit(tabla_afectada, registro_id);

-- Agregar comentario para documentar el propósito de la columna
COMMENT ON COLUMN public.user_audit.registro_id IS 'UUID del registro específico afectado en la tabla_afectada';