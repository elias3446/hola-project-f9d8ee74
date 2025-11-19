-- Deduplicate active participants for each conversation (keep earliest)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY conversacion_id, user_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.participantes_conversacion
  WHERE hidden_at IS NULL
)
DELETE FROM public.participantes_conversacion p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- Enforce uniqueness for active participants per conversation
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_participant
ON public.participantes_conversacion (conversacion_id, user_id)
WHERE hidden_at IS NULL;