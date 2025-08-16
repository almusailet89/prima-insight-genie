-- Fix RLS policies for report_templates to allow public template creation
-- This is needed since the app doesn't have full authentication implemented yet

DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON public.report_templates;

-- Create permissive policies for template management
CREATE POLICY "Anyone can create templates" 
ON public.report_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update templates" 
ON public.report_templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete templates" 
ON public.report_templates 
FOR DELETE 
USING (true);

-- Also fix template_assets policies
DROP POLICY IF EXISTS "Authenticated users can create assets" ON public.template_assets;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON public.template_assets;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON public.template_assets;

CREATE POLICY "Anyone can create assets" 
ON public.template_assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update assets" 
ON public.template_assets 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete assets" 
ON public.template_assets 
FOR DELETE 
USING (true);