-- Add columns to store original user testimonial data
ALTER TABLE public.testimonials 
ADD COLUMN original_testimonial_text text,
ADD COLUMN original_rating integer,
ADD COLUMN is_deleted_by_admin boolean DEFAULT false;

-- Update existing testimonials to copy current values as original
UPDATE public.testimonials 
SET original_testimonial_text = testimonial_text,
    original_rating = rating
WHERE user_id IS NOT NULL;