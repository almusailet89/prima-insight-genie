-- Fill application with 5 years of comprehensive insurance data for Prima Assicurazioni
-- Generate realistic financial data for 2020-2024 with seasonal variations

-- First, insert calendar data for 5 years (2020-2024)
INSERT INTO calendar (period_key, year, month, quarter, week_number) 
SELECT 
  to_char(date_series, 'YYYY-MM') as period_key,
  extract(year from date_series)::integer as year,
  extract(month from date_series)::integer as month,
  'Q' || extract(quarter from date_series)::text as quarter,
  extract(week from date_series)::integer as week_number
FROM generate_series('2020-01-01'::date, '2024-12-01'::date, '1 month'::interval) as date_series
ON CONFLICT (period_key) DO NOTHING;

-- Insert additional dimension data for Prima
INSERT INTO dim_markets (country) VALUES 
('Italy'),
('Spain'), 
('Germany'),
('France'),
('UK')
ON CONFLICT DO NOTHING;

INSERT INTO dim_products (name) VALUES 
('Motor Insurance'),
('Home Insurance'),
('Travel Insurance'),
('Pet Insurance'),
('Business Insurance'),
('Cyber Insurance'),
('Health Insurance')
ON CONFLICT DO NOTHING;

INSERT INTO dim_channels (name) VALUES 
('Digital Direct'),
('Mobile App'),
('Phone Sales'),
('Partner Network'),
('Broker Channel'),
('Comparison Sites')
ON CONFLICT DO NOTHING;

INSERT INTO dim_cost_centers (code, name, department) VALUES 
('IT001', 'Technology Infrastructure', 'IT'),
('MKT001', 'Digital Marketing', 'Marketing'),
('UW001', 'Underwriting', 'Underwriting'),
('CL001', 'Claims Processing', 'Claims'),
('CS001', 'Customer Service', 'Customer Service'),
('FIN001', 'Finance Operations', 'Finance'),
('HR001', 'Human Resources', 'HR'),
('LEG001', 'Legal & Compliance', 'Legal')
ON CONFLICT DO NOTHING;

-- Create comprehensive fact_ledger data for 5 years
WITH date_series AS (
  SELECT 
    c.id as period_id,
    c.period_key,
    c.year,
    c.month
  FROM calendar c 
  WHERE c.year BETWEEN 2020 AND 2024
),
companies AS (
  SELECT id as company_id FROM companies LIMIT 1
),
dimensions AS (
  SELECT 
    bu.id as business_unit_id,
    a.id as account_id,
    p.id as product_id,
    ch.id as channel_id,
    m.id as market_id,
    cc.id as cost_center_id,
    a.name as account_name,
    p.name as product_name,
    m.country,
    c.company_id
  FROM business_units bu
  CROSS JOIN dim_accounts a
  CROSS JOIN dim_products p  
  CROSS JOIN dim_channels ch
  CROSS JOIN dim_markets m
  CROSS JOIN dim_cost_centers cc
  CROSS JOIN companies c
)
INSERT INTO fact_ledger (
  company_id, business_unit_id, account_id, product_id, channel_id, 
  market_id, cost_center_id, period_id, measure, scenario, value
)
SELECT 
  d.company_id,
  d.business_unit_id,
  d.account_id,
  d.product_id,
  d.channel_id,
  d.market_id,
  d.cost_center_id,
  ds.period_id,
  'Amount' as measure,
  scenario,
  CASE 
    -- GWP (Gross Written Premium) - varies by product and market
    WHEN d.account_name = 'GWP' THEN
      CASE 
        WHEN d.product_name = 'Motor Insurance' THEN 
          (800000 + (ds.year - 2020) * 50000 + random() * 200000) * 
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            WHEN 'Spain' THEN 0.6 
            WHEN 'Germany' THEN 0.8 
            WHEN 'France' THEN 0.7 
            WHEN 'UK' THEN 0.5 
          END * 
          (1 + sin(ds.month::float * 3.14159 / 6) * 0.15) * -- Seasonal variation
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.1
            WHEN 'BUDGET' THEN 1.05
            WHEN 'FORECAST' THEN 1.03 + (random() - 0.5) * 0.05
          END
        WHEN d.product_name = 'Home Insurance' THEN 
          (400000 + (ds.year - 2020) * 30000 + random() * 100000) *
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            WHEN 'Spain' THEN 0.7 
            WHEN 'Germany' THEN 0.9 
            WHEN 'France' THEN 0.8 
            WHEN 'UK' THEN 0.6 
          END *
          (1 + sin((ds.month + 3)::float * 3.14159 / 6) * 0.1) *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.08
            WHEN 'BUDGET' THEN 1.04
            WHEN 'FORECAST' THEN 1.02 + (random() - 0.5) * 0.04
          END
        ELSE 
          (200000 + (ds.year - 2020) * 15000 + random() * 50000) *
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            ELSE 0.5 
          END *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.1
            WHEN 'BUDGET' THEN 1.03
            WHEN 'FORECAST' THEN 1.01 + (random() - 0.5) * 0.05
          END
      END
    
    -- Claims - typically 60-70% of GWP
    WHEN d.account_name = 'Claims' THEN
      CASE 
        WHEN d.product_name = 'Motor Insurance' THEN 
          (550000 + (ds.year - 2020) * 35000 + random() * 150000) * 
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            WHEN 'Spain' THEN 0.6 
            WHEN 'Germany' THEN 0.8 
            WHEN 'France' THEN 0.7 
            WHEN 'UK' THEN 0.5 
          END * 
          (1 + sin((ds.month + 1)::float * 3.14159 / 6) * 0.2) * -- Claims spike in winter
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.15
            WHEN 'BUDGET' THEN 0.68
            WHEN 'FORECAST' THEN 0.66 + (random() - 0.5) * 0.08
          END
        ELSE 
          (150000 + (ds.year - 2020) * 10000 + random() * 40000) *
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            ELSE 0.6 
          END *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.12
            WHEN 'BUDGET' THEN 0.65
            WHEN 'FORECAST' THEN 0.63 + (random() - 0.5) * 0.06
          END
      END

    -- Premium Earned - similar to GWP but with timing differences
    WHEN d.account_name = 'Premium_Earned' THEN
      CASE 
        WHEN d.product_name = 'Motor Insurance' THEN 
          (780000 + (ds.year - 2020) * 48000 + random() * 180000) * 
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            WHEN 'Spain' THEN 0.6 
            WHEN 'Germany' THEN 0.8 
            WHEN 'France' THEN 0.7 
            WHEN 'UK' THEN 0.5 
          END * 
          (1 + sin((ds.month - 1)::float * 3.14159 / 6) * 0.12) *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.09
            WHEN 'BUDGET' THEN 1.02
            WHEN 'FORECAST' THEN 1.01 + (random() - 0.5) * 0.04
          END
        ELSE 
          (180000 + (ds.year - 2020) * 12000 + random() * 45000) *
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            ELSE 0.6 
          END *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.08
            WHEN 'BUDGET' THEN 1.01
            WHEN 'FORECAST' THEN 1.005 + (random() - 0.5) * 0.03
          END
      END

    -- Operating Expenses - varies by cost center
    WHEN d.account_name = 'Operating_Expenses' THEN
      (120000 + (ds.year - 2020) * 8000 + random() * 30000) *
      CASE d.country 
        WHEN 'Italy' THEN 1.0 
        WHEN 'Spain' THEN 0.7 
        WHEN 'Germany' THEN 1.1 
        WHEN 'France' THEN 0.9 
        WHEN 'UK' THEN 0.8 
      END *
      CASE scenario
        WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.1
        WHEN 'BUDGET' THEN 0.95
        WHEN 'FORECAST' THEN 0.97 + (random() - 0.5) * 0.05
      END

    -- Revenue - sum of premium earned and investment income
    WHEN d.account_name = 'Revenue' THEN
      CASE 
        WHEN d.product_name = 'Motor Insurance' THEN 
          (820000 + (ds.year - 2020) * 52000 + random() * 190000) * 
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            WHEN 'Spain' THEN 0.6 
            WHEN 'Germany' THEN 0.8 
            WHEN 'France' THEN 0.7 
            WHEN 'UK' THEN 0.5 
          END *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.08
            WHEN 'BUDGET' THEN 1.03
            WHEN 'FORECAST' THEN 1.015 + (random() - 0.5) * 0.04
          END
        ELSE 
          (200000 + (ds.year - 2020) * 15000 + random() * 55000) *
          CASE d.country 
            WHEN 'Italy' THEN 1.0 
            ELSE 0.6 
          END *
          CASE scenario
            WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.07
            WHEN 'BUDGET' THEN 1.02
            WHEN 'FORECAST' THEN 1.01 + (random() - 0.5) * 0.03
          END
      END

    -- Net Income - Revenue minus Claims minus Operating Expenses
    WHEN d.account_name = 'Net_Income' THEN
      (50000 + (ds.year - 2020) * 5000 + random() * 25000) *
      CASE d.country 
        WHEN 'Italy' THEN 1.0 
        WHEN 'Spain' THEN 0.5 
        WHEN 'Germany' THEN 0.7 
        WHEN 'France' THEN 0.6 
        WHEN 'UK' THEN 0.4 
      END *
      CASE scenario
        WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.2
        WHEN 'BUDGET' THEN 1.1
        WHEN 'FORECAST' THEN 1.05 + (random() - 0.5) * 0.1
      END

    -- Investment Income - conservative returns
    WHEN d.account_name = 'Investment_Income' THEN
      (25000 + (ds.year - 2020) * 2000 + random() * 8000) *
      CASE d.country 
        WHEN 'Italy' THEN 1.0 
        ELSE 0.7 
      END *
      (1 + sin((ds.month + 6)::float * 3.14159 / 6) * 0.05) * -- Slight market variations
      CASE scenario
        WHEN 'ACTUAL' THEN 1.0 + (random() - 0.5) * 0.15
        WHEN 'BUDGET' THEN 1.02
        WHEN 'FORECAST' THEN 1.01 + (random() - 0.5) * 0.08
      END

    ELSE 0
  END::numeric(15,2) as value
FROM date_series ds
CROSS JOIN dimensions d
CROSS JOIN (VALUES ('ACTUAL'), ('BUDGET'), ('FORECAST')) AS scenarios(scenario)
WHERE d.account_name IN ('GWP', 'Claims', 'Premium_Earned', 'Operating_Expenses', 'Revenue', 'Net_Income', 'Investment_Income')
ON CONFLICT DO NOTHING;