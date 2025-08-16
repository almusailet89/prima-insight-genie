-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_units table
CREATE TABLE public.business_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  market TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create periods table
CREATE TABLE public.periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_key TEXT NOT NULL UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create overview_kpis table
CREATE TABLE public.overview_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  total_gwp NUMERIC NOT NULL DEFAULT 0,
  total_contracts INTEGER NOT NULL DEFAULT 0,
  variance_pct NUMERIC DEFAULT 0,
  ebitda NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create variance_records table
CREATE TABLE public.variance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  account TEXT NOT NULL,
  actual NUMERIC NOT NULL DEFAULT 0,
  budget NUMERIC NOT NULL DEFAULT 0,
  abs_var NUMERIC NOT NULL DEFAULT 0,
  pct_var NUMERIC DEFAULT 0,
  driver TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_facts table
CREATE TABLE public.sales_facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  channel TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  cogs NUMERIC NOT NULL DEFAULT 0,
  margin NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scenarios table (needed before forecast_facts)
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assumptions JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forecast_facts table
CREATE TABLE public.forecast_facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  gwp NUMERIC NOT NULL DEFAULT 0,
  contracts INTEGER NOT NULL DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  method TEXT DEFAULT 'baseline',
  model_input JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratios_facts table
CREATE TABLE public.ratios_facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  ratio_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  definition TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create narratives table
CREATE TABLE public.narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  tab TEXT NOT NULL CHECK (tab IN ('overview', 'variance', 'sales', 'forecast', 'ratios', 'scenario')),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  details TEXT,
  generated_by TEXT DEFAULT 'AI',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_templates table
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  branding JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_exports table
CREATE TABLE public.report_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  tab TEXT NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE CASCADE,
  json_payload JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (set to permissive for now)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overview_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratios_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can manage companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage business_units" ON public.business_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage periods" ON public.periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage overview_kpis" ON public.overview_kpis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage variance_records" ON public.variance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage sales_facts" ON public.sales_facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage scenarios" ON public.scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage forecast_facts" ON public.forecast_facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage ratios_facts" ON public.ratios_facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage narratives" ON public.narratives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage report_templates" ON public.report_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage report_exports" ON public.report_exports FOR ALL USING (true) WITH CHECK (true);

-- Insert seed data
-- Insert Prima company
INSERT INTO public.companies (id, name, currency) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Prima Assicurazioni', 'EUR');

-- Insert business units
INSERT INTO public.business_units (id, company_id, name) VALUES 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Motor Insurance'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Home Insurance'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Commercial Lines');

-- Insert products
INSERT INTO public.products (id, company_id, name, channel, market) VALUES 
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Motor Third Party', 'Direct', 'Italy'),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Motor Comprehensive', 'Broker', 'Italy'),
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'Home Insurance', 'Direct', 'UK'),
  ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', 'Commercial Property', 'Broker', 'Spain');

-- Insert periods for last 12 months
INSERT INTO public.periods (id, period_key, period_start, period_end) VALUES 
  ('44444444-4444-4444-4444-444444444444', '2024-01', '2024-01-01', '2024-01-31'),
  ('44444444-4444-4444-4444-444444444445', '2024-02', '2024-02-01', '2024-02-29'),
  ('44444444-4444-4444-4444-444444444446', '2024-03', '2024-03-01', '2024-03-31'),
  ('44444444-4444-4444-4444-444444444447', '2024-04', '2024-04-01', '2024-04-30'),
  ('44444444-4444-4444-4444-444444444448', '2024-05', '2024-05-01', '2024-05-31'),
  ('44444444-4444-4444-4444-444444444449', '2024-06', '2024-06-01', '2024-06-30'),
  ('44444444-4444-4444-4444-44444444444a', '2024-07', '2024-07-01', '2024-07-31'),
  ('44444444-4444-4444-4444-44444444444b', '2024-08', '2024-08-01', '2024-08-31'),
  ('44444444-4444-4444-4444-44444444444c', '2024-09', '2024-09-01', '2024-09-30'),
  ('44444444-4444-4444-4444-44444444444d', '2024-10', '2024-10-01', '2024-10-31'),
  ('44444444-4444-4444-4444-44444444444e', '2024-11', '2024-11-01', '2024-11-30'),
  ('44444444-4444-4444-4444-44444444444f', '2024-12', '2024-12-01', '2024-12-31');

-- Insert scenarios
INSERT INTO public.scenarios (id, company_id, name, description, assumptions, created_by) VALUES 
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Baseline', 'Current market conditions', '{"price_change": 0, "volume_change": 0, "loss_ratio_change": 0}', 'System'),
  ('55555555-5555-5555-5555-555555555556', '11111111-1111-1111-1111-111111111111', 'Optimistic', 'Market expansion scenario', '{"price_change": 0.02, "volume_change": 0.15, "loss_ratio_change": -0.05}', 'System'),
  ('55555555-5555-5555-5555-555555555557', '11111111-1111-1111-1111-111111111111', 'Conservative', 'Market contraction scenario', '{"price_change": -0.01, "volume_change": -0.05, "loss_ratio_change": 0.03}', 'System');

-- Insert Prima default template
INSERT INTO public.report_templates (id, company_id, name, description, branding, sections, is_default) VALUES 
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Prima Default Template', 'Prima corporate template with official branding', 
   '{"primary_color": "#003366", "secondary_color": "#FF6B35", "accent_color": "#E8F4FD", "font_family": "Segoe UI", "company_name": "Prima Assicurazioni"}',
   '["title", "overview", "country_breakdown", "variance", "sales", "forecast", "ratios", "scenario_highlights"]',
   true);

-- Sample overview KPIs data
INSERT INTO public.overview_kpis (company_id, period_id, total_gwp, total_contracts, variance_pct, ebitda, notes) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 45200000, 125000, 0.08, 8500000, 'Strong performance in Q4'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444d', 42800000, 118000, 0.05, 8100000, 'Steady growth continues'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444c', 41500000, 115000, 0.12, 7800000, 'Exceeded expectations');

-- Sample variance records data
INSERT INTO public.variance_records (company_id, period_id, unit_id, account, actual, budget, abs_var, pct_var, driver, comment) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '22222222-2222-2222-2222-222222222222', 'GWP', 25000000, 24000000, 1000000, 0.042, 'Price increases', 'Better than expected'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '22222222-2222-2222-2222-222222222223', 'Claims', 15000000, 16000000, -1000000, -0.063, 'Lower frequency', 'Favorable weather'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '22222222-2222-2222-2222-222222222224', 'Expenses', 8500000, 8200000, 300000, 0.037, 'IT investments', 'Planned upgrades');

-- Sample sales facts data
INSERT INTO public.sales_facts (company_id, period_id, product_id, market, channel, units, price, revenue, cogs, margin) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '33333333-3333-3333-3333-333333333333', 'Italy', 'Direct', 45000, 520.00, 23400000, 15210000, 8190000),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '33333333-3333-3333-3333-333333333334', 'Italy', 'Broker', 32000, 680.00, 21760000, 14196000, 7564000),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', '33333333-3333-3333-3333-333333333335', 'UK', 'Direct', 28000, 420.00, 11760000, 7644000, 4116000);

-- Sample forecast facts data
INSERT INTO public.forecast_facts (company_id, period_id, product_id, scenario_id, gwp, contracts, growth_rate, method) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444f', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 24500000, 47000, 0.05, 'baseline'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444f', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555556', 28200000, 54000, 0.15, 'optimistic'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444f', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555557', 23300000, 44500, -0.02, 'conservative');

-- Sample ratios facts data
INSERT INTO public.ratios_facts (company_id, period_id, ratio_name, value, definition) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'EBITDA Margin', 0.188, 'EBITDA as percentage of GWP'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'Loss Ratio', 0.652, 'Claims as percentage of earned premium'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'Combined Ratio', 0.918, 'Loss ratio plus expense ratio'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'ROE', 0.156, 'Return on equity');

-- Sample narratives
INSERT INTO public.narratives (company_id, period_id, tab, summary, details, generated_by) VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'overview', 'Strong Q4 performance with 8% variance above budget', 'Premium growth driven by pricing actions and volume expansion in core markets. EBITDA margin improved to 18.8%.', 'AI'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'variance', 'Favorable variance of €300K driven by lower claims frequency', 'Motor GWP exceeded budget by €1M due to price increases. Claims came in €1M under budget due to favorable weather conditions.', 'AI'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-44444444444e', 'sales', 'Italy remains strongest market with €45M revenue', 'Direct channel outperforming broker channel. Motor comprehensive showing strong margins at 34.8%.', 'AI');