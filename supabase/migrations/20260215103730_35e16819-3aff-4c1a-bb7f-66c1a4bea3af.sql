
-- Create fleet_vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity TEXT NOT NULL,
  image_url TEXT,
  image_drive_id TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Public can read active vehicles
CREATE POLICY "Public can read active fleet vehicles"
ON public.fleet_vehicles
FOR SELECT
USING (is_active = true);

-- Admins can manage fleet vehicles
CREATE POLICY "Admins can manage fleet vehicles"
ON public.fleet_vehicles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_fleet_vehicles_updated_at
BEFORE UPDATE ON public.fleet_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
