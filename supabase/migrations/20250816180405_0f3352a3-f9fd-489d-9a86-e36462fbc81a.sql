-- Enable RLS on report tables
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_templates
CREATE POLICY "Anyone can view report templates" 
ON public.report_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create templates" 
ON public.report_templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update templates" 
ON public.report_templates 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete templates" 
ON public.report_templates 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for template_assets
CREATE POLICY "Anyone can view template assets" 
ON public.template_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create assets" 
ON public.template_assets 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update assets" 
ON public.template_assets 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete assets" 
ON public.template_assets 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for report_instances
CREATE POLICY "Users can view their own reports" 
ON public.report_instances 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.report_instances 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.report_instances 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.report_instances 
FOR DELETE 
USING (auth.uid()::text = user_id);