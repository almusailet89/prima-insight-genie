-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_units table
CREATE TABLE public.business_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dimension tables
CREATE TABLE public.dim_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Revenue', 'COGS', 'Opex', 'EBITDA', 'GWP', 'LR', 'Contracts', 'Conversion', 'Retention')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dim_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dim_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dim_markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  period_key TEXT NOT NULL UNIQUE, -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fact table for ledger data
CREATE TABLE public.fact_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.dim_accounts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.dim_products(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.dim_channels(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.dim_markets(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.calendar(id) ON DELETE CASCADE,
  measure TEXT NOT NULL CHECK (measure IN ('Revenue', 'COGS', 'GM', 'Opex', 'EBITDA', 'GWP', 'LR', 'Contracts', 'Conversion', 'Retention')),
  value DECIMAL(15,2) NOT NULL DEFAULT 0,
  scenario TEXT NOT NULL CHECK (scenario IN ('ACTUAL', 'BUDGET', 'FORECAST')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(company_id, business_unit_id, account_id, product_id, channel_id, market_id, period_id, measure, scenario)
);

-- Create scenario_inputs table for saved scenarios
CREATE TABLE public.scenario_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  params_json JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_jobs table for tracking report generation
CREATE TABLE public.report_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  params_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create audit_log table for tracking user actions
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Analyst', 'Viewer')) DEFAULT 'Viewer',
  first_name TEXT,
  last_name TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_fact_ledger_company ON public.fact_ledger(company_id);
CREATE INDEX idx_fact_ledger_period ON public.fact_ledger(period_id);
CREATE INDEX idx_fact_ledger_scenario ON public.fact_ledger(scenario);
CREATE INDEX idx_fact_ledger_measure ON public.fact_ledger(measure);
CREATE INDEX idx_business_units_company ON public.business_units(company_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access to dimensions and calendar
CREATE POLICY "Public read access to accounts" ON public.dim_accounts FOR SELECT USING (true);
CREATE POLICY "Public read access to products" ON public.dim_products FOR SELECT USING (true);
CREATE POLICY "Public read access to channels" ON public.dim_channels FOR SELECT USING (true);
CREATE POLICY "Public read access to markets" ON public.dim_markets FOR SELECT USING (true);
CREATE POLICY "Public read access to calendar" ON public.calendar FOR SELECT USING (true);

-- Create RLS policies for company-scoped data
CREATE POLICY "Users can view their company data" ON public.companies FOR SELECT 
USING (id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their company business units" ON public.business_units FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their company fact data" ON public.fact_ledger FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for user-specific data
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view their scenario inputs" ON public.scenario_inputs FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create scenario inputs" ON public.scenario_inputs FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their report jobs" ON public.report_jobs FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create report jobs" ON public.report_jobs FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their audit log" ON public.audit_log FOR SELECT 
USING (user_id = auth.uid());

-- Admin policies for data management
CREATE POLICY "Admins can manage all company data" ON public.companies FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admins can manage business units" ON public.business_units FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admins can manage fact data" ON public.fact_ledger FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_units_updated_at
BEFORE UPDATE ON public.business_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fact_ledger_updated_at
BEFORE UPDATE ON public.fact_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();