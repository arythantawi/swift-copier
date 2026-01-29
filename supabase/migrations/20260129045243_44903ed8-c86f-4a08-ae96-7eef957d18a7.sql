-- Add user_id and booking_id to testimonials table to link user reviews
ALTER TABLE public.testimonials 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_testimonials_user_id ON public.testimonials(user_id);
CREATE INDEX idx_testimonials_booking_id ON public.testimonials(booking_id);

-- Update RLS policies to allow users to insert their own reviews
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;

-- Admins can do everything
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Users can insert their own reviews (only for confirmed bookings)
CREATE POLICY "Users can insert own testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_id 
    AND bookings.user_id = auth.uid()
    AND bookings.payment_status IN ('paid', 'confirmed')
  )
);

-- Users can view their own testimonials
CREATE POLICY "Users can view own testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own testimonials (but only text and rating, not activation)
CREATE POLICY "Users can update own testimonials"
ON public.testimonials
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);