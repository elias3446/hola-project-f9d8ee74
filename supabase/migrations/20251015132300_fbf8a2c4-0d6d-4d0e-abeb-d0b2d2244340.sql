-- Fix login_attempts RLS policy that blocks system functions
-- Drop the problematic policy that blocks ALL operations
DROP POLICY IF EXISTS "System functions can manage login attempts" ON public.login_attempts;

-- The existing policy "Users can view their own login attempts" for SELECT is correct
-- Security definer functions will work correctly without the blocking ALL policy

-- Add comment to document the security model
COMMENT ON TABLE public.login_attempts IS 'Login attempt tracking table. Only accessible via SECURITY DEFINER functions for INSERT/UPDATE/DELETE operations. Users can only SELECT their own records via RLS policy.';