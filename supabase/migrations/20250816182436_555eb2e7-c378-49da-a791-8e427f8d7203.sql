-- Create storage buckets for templates and reports
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('templates', 'templates', false),
  ('reports', 'reports', false);

-- Create storage policies for templates bucket
CREATE POLICY "Anyone can view templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Service role can manage templates" ON storage.objects
  FOR ALL USING (bucket_id = 'templates' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users can upload templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'templates' AND auth.uid() IS NOT NULL);

-- Create storage policies for reports bucket  
CREATE POLICY "Users can view their reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage reports" ON storage.objects
  FOR ALL USING (bucket_id = 'reports' AND auth.role() = 'service_role');

CREATE POLICY "Users can upload their reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update report_templates table structure
ALTER TABLE report_templates 
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#003366',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#FF6B35', 
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#E8F4FD',
ADD COLUMN IF NOT EXISTS heading_font text DEFAULT 'Segoe UI',
ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Segoe UI',
ADD COLUMN IF NOT EXISTS layouts_json jsonb DEFAULT '{}';

-- Create report_blueprints table
CREATE TABLE IF NOT EXISTS report_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES report_templates(id),
  slides_json jsonb DEFAULT '[]',
  filters_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on report_blueprints
ALTER TABLE report_blueprints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_blueprints
CREATE POLICY "Users can manage their blueprints" ON report_blueprints
  FOR ALL USING (created_by = auth.uid());

-- Update report_jobs table structure
ALTER TABLE report_jobs 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES report_templates(id),
ADD COLUMN IF NOT EXISTS blueprint_id uuid REFERENCES report_blueprints(id);

-- Create app_settings table for active template
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  active_template_id uuid REFERENCES report_templates(id),
  settings_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_settings
CREATE POLICY "Users can manage their settings" ON app_settings
  FOR ALL USING (user_id = auth.uid());