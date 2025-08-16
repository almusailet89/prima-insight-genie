-- Insert a default Prima template
INSERT INTO public.report_templates (
  name,
  description,
  company_name,
  template_type,
  is_default,
  branding_config,
  slide_layouts,
  chart_styles,
  table_styles
) VALUES (
  'Prima Corporate Standard',
  'Default Prima Finance corporate presentation template with official branding',
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
  }'::jsonb,
  '[
    {
      "type": "title",
      "name": "Title Slide",
      "elements": ["title", "subtitle", "logo", "date"]
    },
    {
      "type": "overview", 
      "name": "Executive Overview",
      "elements": ["title", "kpi-grid", "commentary", "chart"]
    },
    {
      "type": "country",
      "name": "Country Analysis", 
      "elements": ["title", "map", "country-metrics", "comparison"]
    },
    {
      "type": "variance",
      "name": "Variance Analysis",
      "elements": ["title", "variance-table", "explanations", "trends"]
    },
    {
      "type": "forecast",
      "name": "Forecast & Trends",
      "elements": ["title", "forecast-chart", "scenarios", "insights"]
    }
  ]'::jsonb,
  '{
    "chartStyle": "modern",
    "colorPalette": ["#003366", "#FF6B35", "#E8F4FD", "#7BA7BC", "#FFA366"],
    "gridLines": true,
    "dataLabels": true,
    "fontSize": 12
  }'::jsonb,
  '{
    "headerStyle": "prima-blue",
    "alternateRowColor": "#F8F9FA", 
    "borderStyle": "minimal",
    "fontSize": 11
  }'::jsonb
) ON CONFLICT DO NOTHING;