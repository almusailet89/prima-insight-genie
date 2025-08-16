-- Simple data insert with proper numeric casting
INSERT INTO public.fact_ledger (company_id, business_unit_id, account_id, product_id, channel_id, market_id, period_id, cost_center_id, scenario, measure, value) 
SELECT 
  (SELECT id FROM companies LIMIT 1) as company_id,
  (SELECT id FROM dim_products ORDER BY random() LIMIT 1) as business_unit_id,
  (SELECT id FROM dim_accounts ORDER BY random() LIMIT 1) as account_id,
  prod.id as product_id,
  ch.id as channel_id,
  mkt.id as market_id,
  cal.id as period_id,
  cc.id as cost_center_id,
  scenario_type.scenario,
  measure_type.measure,
  -- Generate realistic values with proper casting
  (CASE 
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
    WHEN measure_type.measure = 'Revenue' THEN 
      CASE scenario_type.scenario
        WHEN 'ACTUAL' THEN CASE WHEN cal.month <= 8 THEN (random() * 2000000 + 5000000) * (1 + (cal.month - 6) * 0.02) ELSE NULL END
        WHEN 'BUDGET' THEN (random() * 1800000 + 5500000) * (1 + (cal.month - 6) * 0.03)
        WHEN 'FORECAST' THEN CASE WHEN cal.month <= 8 THEN NULL ELSE (random() * 1900000 + 5200000) * (1 + (cal.month - 6) * 0.025) END
      END
    ELSE (random() * 1000000 + 500000)
  END)::numeric as value
FROM 
  (SELECT id FROM public.dim_products LIMIT 2) prod
CROSS JOIN 
  (SELECT id FROM public.dim_channels LIMIT 2) ch
CROSS JOIN 
  (SELECT id FROM public.dim_markets LIMIT 2) mkt
CROSS JOIN 
  (SELECT id, month FROM public.calendar WHERE year = 2024) cal
CROSS JOIN 
  (SELECT id FROM public.dim_cost_centers LIMIT 2) cc
CROSS JOIN 
  (VALUES ('ACTUAL'), ('BUDGET'), ('FORECAST')) scenario_type(scenario)
CROSS JOIN 
  (VALUES ('GWP'), ('Claims'), ('Revenue'), ('COGS'), ('EBITDA')) measure_type(measure)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fact_ledger fl2 
  WHERE fl2.product_id = prod.id 
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