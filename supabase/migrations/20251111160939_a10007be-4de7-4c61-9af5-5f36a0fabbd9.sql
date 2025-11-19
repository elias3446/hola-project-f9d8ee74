-- Fix RLS violation on insert returning by allowing creators to read their newly created conversations
-- 1) Add created_by column and supporting constraints
ALTER TABLE public.conversaciones
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Set default to current profile (uses existing helper)
ALTER TABLE public.conversaciones
  ALTER COLUMN created_by SET DEFAULT public.get_profile_id_from_auth();

-- Add FK to profiles table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversaciones_created_by_fkey'
  ) THEN
    ALTER TABLE public.conversaciones
      ADD CONSTRAINT conversaciones_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_conversaciones_created_by
  ON public.conversaciones(created_by);

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;

-- 2) Add SELECT policy so creators can see the row they just inserted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'conversaciones' 
      AND policyname = 'Creador puede ver su conversación'
  ) THEN
    CREATE POLICY "Creador puede ver su conversación"
    ON public.conversaciones
    FOR SELECT
    TO authenticated
    USING (created_by = public.get_profile_id_from_auth());
  END IF;
END $$;
