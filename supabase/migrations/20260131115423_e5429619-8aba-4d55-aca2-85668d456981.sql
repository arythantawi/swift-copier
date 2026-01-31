-- Revoke all access from anon role on bookings table
REVOKE ALL ON public.bookings FROM anon;

-- Grant only INSERT to anon for public booking creation (unauthenticated users can still book)
GRANT INSERT ON public.bookings TO anon;

-- Ensure authenticated users have proper access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

-- Drop existing SELECT policies and recreate with explicit authenticated requirement
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Recreate policies with explicit 'authenticated' role check
CREATE POLICY "Authenticated users can view their own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));