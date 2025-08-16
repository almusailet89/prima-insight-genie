-- Add cost centers dimension table
CREATE TABLE IF NOT EXISTS public.dim_cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add cost center column to fact_ledger
ALTER TABLE public.fact_ledger ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.dim_cost_centers(id);

-- Add weekly calendar support
ALTER TABLE public.calendar ADD COLUMN IF NOT EXISTS week_number INTEGER;
ALTER TABLE public.calendar ADD COLUMN IF NOT EXISTS quarter TEXT;

-- Insert cost centers
INSERT INTO public.dim_cost_centers (code, name, department) VALUES
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
ON CONFLICT (code) DO NOTHING;

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
  END;

-- Add more comprehensive insurance measures and complete data for all months
INSERT INTO public.fact_ledger (company_id, business_unit_id, account_id, product_id, channel_id, market_id, period_id, cost_center_id, scenario, measure, value) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid as company_id,
  bu.id as business_unit_id,
  acc.id as account_id,
  prod.id as product_id,
  ch.id as channel_id,
  mkt.id as market_id,
  cal.id as period_id,
  cc.id as cost_center_id,
  scenario_type.scenario,
  measure_type.measure,
  -- Generate realistic values based on measure type and scenario
  CASE 
    -- Insurance specific measures
    WHEN measure_type.measure = 'GWP' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 5000000 + 8000000) * (1 + (cal.month - 6) * 0.02) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 4000000 + 9000000) * (1 + (cal.month - 6) * 0.03)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 4500000 + 8500000) * (1 + (cal.month - 6) * 0.025) END
      END
    WHEN measure_type.measure = 'Claims' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 3000000 + 4500000) * (1 + (cal.month - 6) * 0.01) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 2500000 + 5000000) * (1 + (cal.month - 6) * 0.02)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 2800000 + 4700000) * (1 + (cal.month - 6) * 0.015) END
      END
    WHEN measure_type.measure = 'Premium_Earned' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 4500000 + 7500000) * (1 + (cal.month - 6) * 0.02) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 3800000 + 8500000) * (1 + (cal.month - 6) * 0.03)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 4200000 + 8000000) * (1 + (cal.month - 6) * 0.025) END
      END
    WHEN measure_type.measure = 'Operating_Expenses' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 1500000 + 2000000) * (1 + (cal.month - 6) * 0.015) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 1200000 + 2200000) * (1 + (cal.month - 6) * 0.02)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 1400000 + 2100000) * (1 + (cal.month - 6) * 0.018) END
      END
    -- Traditional measures
    WHEN measure_type.measure = 'Revenue' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 2000000 + 5000000) * (1 + (cal.month - 6) * 0.02) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 1800000 + 5500000) * (1 + (cal.month - 6) * 0.03)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 1900000 + 5200000) * (1 + (cal.month - 6) * 0.025) END
      END
    WHEN measure_type.measure = 'COGS' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 1200000 + 2800000) * (1 + (cal.month - 6) * 0.015) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 1000000 + 3000000) * (1 + (cal.month - 6) * 0.02)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 1100000 + 2900000) * (1 + (cal.month - 6) * 0.018) END
      END
    WHEN measure_type.measure = 'Opex' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 800000 + 1200000) * (1 + (cal.month - 6) * 0.01) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 700000 + 1300000) * (1 + (cal.month - 6) * 0.015)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 750000 + 1250000) * (1 + (cal.month - 6) * 0.012) END
      END
    WHEN measure_type.measure = 'EBITDA' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 500000 + 800000) * (1 + (cal.month - 6) * 0.025) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 450000 + 900000) * (1 + (cal.month - 6) * 0.03)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 480000 + 850000) * (1 + (cal.month - 6) * 0.028) END
      END
    WHEN measure_type.measure = 'Net_Income' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 300000 + 400000) * (1 + (cal.month - 6) * 0.02) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 280000 + 450000) * (1 + (cal.month - 6) * 0.025)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 290000 + 420000) * (1 + (cal.month - 6) * 0.022) END
      END
    WHEN measure_type.measure = 'Investment_Income' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 200000 + 300000) * (1 + (cal.month - 6) * 0.015) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 180000 + 320000) * (1 + (cal.month - 6) * 0.02)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 190000 + 310000) * (1 + (cal.month - 6) * 0.018) END
      END
    ELSE (random() * 1000000 + 500000)
  END::numeric as value
FROM 
  (SELECT '44444444-4444-4444-4444-444444444441'::uuid as id UNION ALL 
   SELECT '44444444-4444-4444-4444-444444444442'::uuid UNION ALL 
   SELECT '44444444-4444-4444-4444-444444444443'::uuid) bu
CROSS JOIN 
  (SELECT '33333333-3333-3333-3333-333333333331'::uuid as id UNION ALL 
   SELECT '33333333-3333-3333-3333-333333333332'::uuid UNION ALL 
   SELECT '33333333-3333-3333-3333-333333333333'::uuid) acc
CROSS JOIN 
  (SELECT '44444444-4444-4444-4444-444444444441'::uuid as id UNION ALL 
   SELECT '44444444-4444-4444-4444-444444444442'::uuid UNION ALL 
   SELECT '44444444-4444-4444-4444-444444444443'::uuid) prod
CROSS JOIN 
  (SELECT '55555555-5555-5555-5555-555555555551'::uuid as id UNION ALL 
   SELECT '55555555-5555-5555-5555-555555555552'::uuid) ch
CROSS JOIN 
  (SELECT '66666666-6666-6666-6666-666666666661'::uuid as id UNION ALL 
   SELECT '66666666-6666-6666-6666-666666666662'::uuid UNION ALL 
   SELECT '66666666-6666-6666-6666-666666666663'::uuid) mkt
CROSS JOIN 
  (SELECT id, month FROM public.calendar WHERE year = 2024) cal
CROSS JOIN 
  (SELECT id FROM public.dim_cost_centers LIMIT 5) cc
CROSS JOIN 
  (VALUES ('ACTUAL'), ('BUDGET'), ('FORECAST')) scenario_type(scenario)
CROSS JOIN 
  (VALUES 
    ('GWP'), ('Claims'), ('Premium_Earned'), ('Operating_Expenses'), 
    ('Revenue'), ('COGS'), ('Opex'), ('EBITDA'), ('Net_Income'), ('Investment_Income')
  ) measure_type(measure)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fact_ledger fl2 
  WHERE fl2.business_unit_id = bu.id 
    AND fl2.account_id = acc.id 
    AND fl2.product_id = prod.id 
    AND fl2.channel_id = ch.id 
    AND fl2.market_id = mkt.id 
    AND fl2.period_id = cal.id 
    AND fl2.cost_center_id = cc.id 
    AND fl2.scenario = scenario_type.scenario 
    AND fl2.measure = measure_type.measure
)
AND (
  (scenario_type.scenario = 'ACTUAL' AND cal.month <= 8) OR
  (scenario_type.scenario = 'BUDGET') OR
  (scenario_type.scenario = 'FORECAST' AND cal.month > 8)
);

-- Enable RLS on cost centers
ALTER TABLE public.dim_cost_centers ENABLE ROW LEVEL SECURITY;

-- Create policy for cost centers
CREATE POLICY "Public read access to cost centers" 
ON public.dim_cost_centers 
FOR SELECT 
USING (true);