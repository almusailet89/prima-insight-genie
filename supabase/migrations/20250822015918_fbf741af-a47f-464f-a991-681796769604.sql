-- Fix security vulnerability in cost_monitoring table
-- Add company_id column to enable proper access control
ALTER TABLE public.cost_monitoring 
ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update existing records to have a default company (assuming Prima is the first/default company)
UPDATE public.cost_monitoring 
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

-- Make company_id required for future records
ALTER TABLE public.cost_monitoring 
ALTER COLUMN company_id SET NOT NULL;

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "read_all_cost_monitoring" ON public.cost_monitoring;

-- Create secure RLS policies following the same pattern as other financial tables
CREATE POLICY "Admins can manage cost monitoring data" 
ON public.cost_monitoring 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles 
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'Admin'::text))
));

CREATE POLICY "Users can view their company cost monitoring data" 
ON public.cost_monitoring 
FOR SELECT 
USING (company_id IN ( 
  SELECT profiles.company_id 
  FROM profiles 
  WHERE (profiles.user_id = auth.uid())
));

-- Update the server writes policy to include company_id validation
DROP POLICY IF EXISTS "server_writes_cost_monitoring" ON public.cost_monitoring;

CREATE POLICY "Service role can insert cost monitoring data" 
ON public.cost_monitoring 
FOR INSERT 
WITH CHECK (
  auth.role() = 'service_role'::text AND 
  company_id IS NOT NULL
);