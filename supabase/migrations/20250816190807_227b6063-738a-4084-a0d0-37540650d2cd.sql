-- Add cost centers dimension table
CREATE TABLE IF NOT EXISTS public.dim_cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add cost center column to fact_ledger
ALTER TABLE public.fact_ledger ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.dim_cost_centers(id);

-- Add weekly calendar support
ALTER TABLE public.calendar ADD COLUMN IF NOT EXISTS week_number INTEGER;
ALTER TABLE public.calendar ADD COLUMN IF NOT EXISTS quarter TEXT;

-- Insert cost centers only if they don't exist
INSERT INTO public.dim_cost_centers (code, name, department)
SELECT code, name, department FROM (VALUES
  ('CC001', 'Underwriting Operations', 'Underwriting'),
  ('CC002', 'Claims Processing', 'Claims'),
  ('CC003', 'Sales & Marketing', 'Sales'),
  ('CC004', 'IT Operations', 'Technology'),
  ('CC005', 'Finance & Accounting', 'Finance'),
  ('CC006', 'Human Resources', 'HR'),
  ('CC007', 'Risk Management', 'Risk'),
  ('CC008', 'Customer Service', 'Operations'),
  ('CC009', 'Investment Management', 'Investments'),
  ('CC010', 'Reinsurance', 'Underwriting'),
  ('CC011', 'Product Development', 'Strategy'),
  ('CC012', 'Compliance & Legal', 'Legal'),
  ('CC013', 'Actuarial Services', 'Actuarial'),
  ('CC014', 'Business Intelligence', 'Analytics'),
  ('CC015', 'Facilities Management', 'Operations')
) AS new_centers(code, name, department)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dim_cost_centers WHERE dim_cost_centers.code = new_centers.code
);

-- Update calendar with quarters and weeks
UPDATE public.calendar SET 
  quarter = CASE 
    WHEN month IN (1,2,3) THEN year || '-Q1'
    WHEN month IN (4,5,6) THEN year || '-Q2'
    WHEN month IN (7,8,9) THEN year || '-Q3'
    WHEN month IN (10,11,12) THEN year || '-Q4'
  END,
  week_number = CASE 
    WHEN month = 1 THEN 1
    WHEN month = 2 THEN 5
    WHEN month = 3 THEN 9
    WHEN month = 4 THEN 14
    WHEN month = 5 THEN 18
    WHEN month = 6 THEN 23
    WHEN month = 7 THEN 27
    WHEN month = 8 THEN 31
    WHEN month = 9 THEN 36
    WHEN month = 10 THEN 40
    WHEN month = 11 THEN 44
    WHEN month = 12 THEN 49
  END
WHERE quarter IS NULL OR week_number IS NULL;

-- Enable RLS on cost centers
ALTER TABLE public.dim_cost_centers ENABLE ROW LEVEL SECURITY;

-- Create policy for cost centers
CREATE POLICY "Public read access to cost centers" 
ON public.dim_cost_centers 
FOR SELECT 
USING (true);