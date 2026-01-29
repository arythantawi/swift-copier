-- Update INSERT policy to allow users to set their own user_id when booking
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;

CREATE POLICY "Public can create bookings with optional user_id"
ON public.bookings
FOR INSERT
WITH CHECK (
  (customer_name IS NOT NULL) AND 
  (customer_phone IS NOT NULL) AND 
  (pickup_address IS NOT NULL) AND 
  (route_from IS NOT NULL) AND 
  (route_to IS NOT NULL) AND 
  (travel_date IS NOT NULL) AND 
  (pickup_time IS NOT NULL) AND 
  (order_id IS NOT NULL) AND
  (user_id IS NULL OR user_id = auth.uid())
);