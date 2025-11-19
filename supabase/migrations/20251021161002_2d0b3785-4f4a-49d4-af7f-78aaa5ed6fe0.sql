-- Fix admin audit log policy to use profile_id instead of auth.uid()

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.user_audit;

-- Recreate with correct profile_id check
CREATE POLICY "Admins can view all audit logs" 
ON public.user_audit
FOR SELECT 
USING (has_role(get_profile_id_from_auth(), 'administrador'::user_role));