-- Fix FAQs RLS policies to allow both admin and super_admin
DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;

CREATE POLICY "Admins can manage faqs" 
ON public.faqs 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Ensure proper grants
REVOKE ALL ON public.faqs FROM anon;
GRANT SELECT ON public.faqs TO anon;
GRANT ALL ON public.faqs TO authenticated;