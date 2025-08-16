import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, Building, TrendingUp, FileText, Download, Star } from 'lucide-react';

interface PrimaTemplate {
  id: string;
  name: string;
  description: string;
  template_type: 'executive' | 'operational' | 'board' | 'regulatory';
  company_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  is_default: boolean;
  branding_config: any;
  slide_layouts: any;
  chart_styles: any;
  table_styles: any;
  created_at?: string;
  updated_at?: string;
  preview_url?: string;
}

export default function PrimaReportTemplates() {
  const [templates, setTemplates] = useState<PrimaTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePrimaTemplates();
  }, []);

  const initializePrimaTemplates = async () => {
    setLoading(true);
    try {
      // Create Prima-branded professional templates
      const primaTemplates = [
        {
          name: 'Prima Executive Dashboard',
          description: 'High-level executive summary with key financial metrics and market performance indicators',
          company_name: 'Prima Assicurazioni',
          template_type: 'executive',
          primary_color: '#003366', // Prima navy blue
          secondary_color: '#FF6B35', // Prima orange
          accent_color: '#E8F4FD', // Light blue
          heading_font: 'Segoe UI',
          body_font: 'Segoe UI',
          is_default: true,
          branding_config: {
            logo_url: '/src/assets/prima-logo.ico',
            company_tagline: 'Great experience, great price',
            footer_text: '© 2025 Prima Assicurazioni - Piazzale Loreto 17, 20131 Milan, Italy',
            colors: {
              primary: '#003366',
              secondary: '#FF6B35',
              accent: '#E8F4FD',
              text: '#333333',
              background: '#FFFFFF'
            }
          },
          slide_layouts: [
            {
              type: 'title_slide',
              elements: ['company_logo', 'report_title', 'date', 'confidentiality_notice']
            },
            {
              type: 'executive_summary',
              elements: ['key_metrics_grid', 'performance_chart', 'highlights_list']
            },
            {
              type: 'financial_overview',
              elements: ['gwp_chart', 'claims_ratio', 'profitability_metrics']
            },
            {
              type: 'market_analysis',
              elements: ['market_share_chart', 'geographic_breakdown', 'competitive_position']
            },
            {
              type: 'appendix',
              elements: ['detailed_tables', 'methodology', 'disclaimers']
            }
          ],
          chart_styles: {
            color_palette: ['#003366', '#FF6B35', '#E8F4FD', '#7FB3D3', '#FFA366'],
            font: 'Segoe UI',
            background: '#FFFFFF',
            grid_color: '#E0E0E0'
          },
          table_styles: {
            header_color: '#003366',
            header_text_color: '#FFFFFF',
            row_colors: ['#FFFFFF', '#F8F9FA'],
            border_color: '#E0E0E0',
            font: 'Segoe UI'
          }
        },
        {
          name: 'Prima Operational Report',
          description: 'Detailed operational metrics with departmental breakdown and KPI tracking',
          company_name: 'Prima Assicurazioni',
          template_type: 'operational',
          primary_color: '#003366',
          secondary_color: '#FF6B35',
          accent_color: '#E8F4FD',
          heading_font: 'Segoe UI',
          body_font: 'Segoe UI',
          is_default: false,
          branding_config: {
            logo_url: '/src/assets/prima-logo.ico',
            company_tagline: 'Great experience, great price',
            footer_text: '© 2025 Prima Assicurazioni - Operational Excellence Division',
            colors: {
              primary: '#003366',
              secondary: '#FF6B35',
              accent: '#E8F4FD',
              text: '#333333',
              background: '#FFFFFF'
            }
          },
          slide_layouts: [
            {
              type: 'operational_dashboard',
              elements: ['kpi_scorecard', 'trend_analysis', 'variance_report']
            },
            {
              type: 'department_breakdown',
              elements: ['department_metrics', 'cost_analysis', 'efficiency_ratios']
            },
            {
              type: 'product_performance',
              elements: ['product_mix', 'profitability_analysis', 'growth_metrics']
            }
          ]
        },
        {
          name: 'Prima Board Presentation',
          description: 'Comprehensive board-level presentation with strategic insights and governance metrics',
          company_name: 'Prima Assicurazioni',
          template_type: 'board',
          primary_color: '#003366',
          secondary_color: '#FF6B35',
          accent_color: '#E8F4FD',
          heading_font: 'Segoe UI',
          body_font: 'Segoe UI',
          is_default: false,
          branding_config: {
            logo_url: '/src/assets/prima-logo.ico',
            company_tagline: 'Great experience, great price',
            footer_text: '© 2025 Prima Assicurazioni - Board of Directors - Confidential',
            colors: {
              primary: '#003366',
              secondary: '#FF6B35',
              accent: '#E8F4FD',
              text: '#333333',
              background: '#FFFFFF'
            }
          },
          slide_layouts: [
            {
              type: 'strategic_overview',
              elements: ['strategic_initiatives', 'market_position', 'competitive_analysis']
            },
            {
              type: 'financial_performance',
              elements: ['financial_highlights', 'profitability_trends', 'capital_efficiency']
            },
            {
              type: 'risk_management',
              elements: ['risk_metrics', 'solvency_ratios', 'regulatory_compliance']
            }
          ]
        },
        {
          name: 'Prima Regulatory Report',
          description: 'Regulatory compliance report with Solvency II metrics and IVASS requirements',
          company_name: 'Prima Assicurazioni',
          template_type: 'regulatory',
          primary_color: '#003366',
          secondary_color: '#FF6B35',
          accent_color: '#E8F4FD',
          heading_font: 'Segoe UI',
          body_font: 'Segoe UI',
          is_default: false,
          branding_config: {
            logo_url: '/src/assets/prima-logo.ico',
            company_tagline: 'Great experience, great price',
            footer_text: '© 2025 Prima Assicurazioni - Regulatory Compliance Division',
            colors: {
              primary: '#003366',
              secondary: '#FF6B35',
              accent: '#E8F4FD',
              text: '#333333',
              background: '#FFFFFF'
            }
          },
          slide_layouts: [
            {
              type: 'solvency_overview',
              elements: ['solvency_ratios', 'capital_requirements', 'own_funds']
            },
            {
              type: 'regulatory_metrics',
              elements: ['ivass_indicators', 'mcev_calculations', 'stress_tests']
            },
            {
              type: 'compliance_status',
              elements: ['regulatory_timeline', 'compliance_checklist', 'action_items']
            }
          ]
        }
      ];

      // Insert templates into database
      for (const template of primaTemplates) {
        const { error } = await supabase
          .from('report_templates')
          .upsert(template, { 
            onConflict: 'name',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Error creating template:', error);
        }
      }

      // Fetch all templates
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('company_name', 'Prima Assicurazioni')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTemplates((data as any[])?.map(template => ({
        ...template,
        template_type: template.template_type as 'executive' | 'operational' | 'board' | 'regulatory'
      })) || []);
      toast.success('Prima professional templates loaded successfully');

    } catch (error) {
      console.error('Error initializing templates:', error);
      toast.error('Failed to load Prima templates');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'executive':
        return <TrendingUp className="h-5 w-5" />;
      case 'operational':
        return <Building className="h-5 w-5" />;
      case 'board':
        return <Star className="h-5 w-5" />;
      case 'regulatory':
        return <FileText className="h-5 w-5" />;
      default:
        return <Palette className="h-5 w-5" />;
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'executive':
        return 'bg-blue-100 text-blue-800';
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'board':
        return 'bg-purple-100 text-purple-800';
      case 'regulatory':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      // Set as active template in app_settings
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          active_template_id: templateId,
          settings_json: { selected_template: templateId }
        });

      if (error) throw error;

      toast.success('Template activated successfully');
    } catch (error) {
      toast.error('Failed to activate template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Prima Professional Templates
          </h2>
          <p className="text-muted-foreground">
            Professionally designed report templates with Prima branding and industry best practices
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Prima Assicurazioni
        </Badge>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTemplateIcon(template.template_type)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getTemplateTypeColor(template.template_type)}
                  >
                    {template.template_type}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Prima Color Palette */}
                  <div>
                    <div className="text-sm font-medium mb-2">Prima Brand Colors</div>
                    <div className="flex gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: '#003366' }}
                        title="Prima Navy Blue"
                      />
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: '#FF6B35' }}
                        title="Prima Orange"
                      />
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: '#E8F4FD' }}
                        title="Prima Light Blue"
                      />
                    </div>
                  </div>

                  {/* Template Features */}
                  <div>
                    <div className="text-sm font-medium mb-2">Features</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">AI-Powered</Badge>
                      <Badge variant="outline" className="text-xs">Prima Branding</Badge>
                      <Badge variant="outline" className="text-xs">Professional</Badge>
                      {template.is_default && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => useTemplate(template.id)}
                      className="flex-1"
                      variant="default"
                    >
                      Use Template
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            About Prima Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Design Standards</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Consistent Prima branding and color scheme</li>
                <li>• Professional insurance industry layouts</li>
                <li>• Optimized for executive presentations</li>
                <li>• Regulatory compliance friendly</li>
                <li>• Mobile and print optimized</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic data visualization</li>
                <li>• Intelligent content generation</li>
                <li>• Smart chart recommendations</li>
                <li>• Context-aware insights</li>
                <li>• Natural language summaries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}