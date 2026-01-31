-- Revoke all access from anon role on admin_activity_logs table
REVOKE ALL ON public.admin_activity_logs FROM anon;

-- Ensure only authenticated users with proper roles can access
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;

-- Drop existing policies and recreate with explicit authenticated requirement
DROP POLICY IF EXISTS "Super admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Admins can insert own activity logs" ON public.admin_activity_logs;

-- Recreate policies with explicit 'authenticated' role requirement
CREATE POLICY "Super admins can view activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can insert own activity logs" 
ON public.admin_activity_logs 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));