-- Add user_id column to bookings table to link bookings to authenticated users
ALTER TABLE public.bookings 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster user booking queries
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);

-- Create RLS policy for users to view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep existing admin policy (admins can see all bookings via has_role function)
-- The existing policies should remain for admin access