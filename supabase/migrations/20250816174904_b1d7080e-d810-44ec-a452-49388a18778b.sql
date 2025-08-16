-- Create template management tables
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL DEFAULT 'Prima',
  template_type TEXT NOT NULL DEFAULT 'corporate', -- corporate, financial, executive
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Template configuration
  branding_config JSONB NOT NULL DEFAULT '{}', -- colors, fonts, logos
  slide_layouts JSONB NOT NULL DEFAULT '[]', -- layout definitions
  chart_styles JSONB NOT NULL DEFAULT '{}', -- chart styling options
  table_styles JSONB NOT NULL DEFAULT '{}' -- table styling options
);

-- Create template assets table for storing logos, backgrounds, etc.
CREATE TABLE public.template_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- logo, background, icon, font
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report instances table to track generated reports
CREATE TABLE public.report_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.report_templates(id),
  title TEXT NOT NULL,
  generated_by UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, generating, completed, failed
  download_url TEXT,
  configuration JSONB NOT NULL DEFAULT '{}', -- report parameters
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_instances ENABLE ROW LEVEL SECURITY;

-- Create policies for report_templates
CREATE POLICY "Users can view all templates" 
ON public.report_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage templates" 
ON public.report_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'Admin'
));

-- Create policies for template_assets
CREATE POLICY "Users can view template assets" 
ON public.template_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage template assets" 
ON public.template_assets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'Admin'
));

-- Create policies for report_instances
CREATE POLICY "Users can view their report instances" 
ON public.report_instances 
FOR SELECT 
USING (generated_by = auth.uid());

CREATE POLICY "Users can create report instances" 
ON public.report_instances 
FOR INSERT 
WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Users can update their report instances" 
ON public.report_instances 
FOR UPDATE 
USING (generated_by = auth.uid());

-- Insert default Prima template
INSERT INTO public.report_templates (name, description, company_name, template_type, is_default, branding_config, slide_layouts, chart_styles, table_styles) VALUES (
  'Prima Corporate Standard',
  'Standard Prima corporate template with official branding and layouts',
  'Prima',
  'corporate',
  true,
  '{
    "primaryColor": "#003366",
    "secondaryColor": "#FF6B35",
    "accentColor": "#E8F4FD",
    "textColor": "#333333",
    "backgroundColor": "#FFFFFF",
    "fontFamily": "Segoe UI",
    "logoPosition": "top-left",
    "footerText": "Prima Finance - Confidential"
  }',
  '[
    {
      "type": "title",
      "name": "Title Slide",
      "elements": ["title", "subtitle", "logo", "date"]
    },
    {
      "type": "overview",
      "name": "KPI Overview",
      "elements": ["title", "kpi-grid", "commentary", "chart"]
    },
    {
      "type": "analysis",
      "name": "Analysis Slide",
      "elements": ["title", "chart", "table", "insights"]
    },
    {
      "type": "country",
      "name": "Country Breakdown",
      "elements": ["title", "country-map", "metrics", "trends"]
    }
  ]',
  '{
    "chartStyle": "modern",
    "colorPalette": ["#003366", "#FF6B35", "#E8F4FD", "#7BA7BC", "#FFA366"],
    "gridLines": true,
    "dataLabels": true,
    "fontSize": 12
  }',
  '{
    "headerStyle": "prima-blue",
    "alternateRowColor": "#F8F9FA",
    "borderStyle": "minimal",
    "fontSize": 11
  }'
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_report_templates_updated_at 
BEFORE UPDATE ON public.report_templates 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();