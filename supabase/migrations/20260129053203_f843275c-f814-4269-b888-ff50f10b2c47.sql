-- Drop existing SELECT policies on admin_profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.admin_profiles;

-- Create secure SELECT policy: only super_admins can view all, users can view own
CREATE POLICY "Secure admin profile read access"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR user_id = auth.uid()
);

-- Recreate ALL policy for super_admins (for INSERT, UPDATE, DELETE operations)
CREATE POLICY "Super admins full access"
ON public.admin_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));