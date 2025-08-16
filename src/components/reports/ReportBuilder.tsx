import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Loader2, 
  BarChart3, 
  Table2, 
  TrendingUp, 
  PieChart,
  LineChart,
  Users,
  Target,
  Calendar,
  MapPin
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  name: string;
  description: string;
  branding_config: any;
  slide_layouts: any;
  chart_styles: any;
  table_styles: any;
}

interface ReportSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  config: any;
}

export function ReportBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('Prima Finance Report');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Italy', 'UK', 'Spain']);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
    initializeDefaultSections();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        slide_layouts: Array.isArray(template.slide_layouts) ? template.slide_layouts : []
      })));
      
      // Auto-select default template
      const defaultTemplate = data?.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
    }
  };

  const initializeDefaultSections = () => {
    const defaultSections: ReportSection[] = [
      {
        id: 'title',
        type: 'title',
        title: 'Title Slide',
        enabled: true,
        config: { showDate: true, showLogo: true }
      },
      {
        id: 'overview',
        type: 'overview',
        title: 'Executive Overview',
        enabled: true,
        config: { showKPIs: true, showCharts: true, includeCommentary: true }
      },
      {
        id: 'country_analysis',
        type: 'country',
        title: 'Country Analysis',
        enabled: true,
        config: { showMaps: true, showTrends: true, compareCountries: true }
      },
      {
        id: 'variance_analysis',
        type: 'variance',
        title: 'Variance Analysis',
        enabled: true,
        config: { showTableView: true, highlightOutliers: true, includeExplanations: true }
      },
      {
        id: 'forecast_trends',
        type: 'forecast',
        title: 'Forecast & Trends',
        enabled: true,
        config: { forecastMonths: 12, showConfidenceInterval: true, includeScenarios: false }
      },
      {
        id: 'cost_breakdown',
        type: 'costs',
        title: 'Cost Breakdown',
        enabled: false,
        config: { groupBy: 'department', showHierarchy: true }
      },
      {
        id: 'scenario_analysis',
        type: 'scenario',
        title: 'Scenario Analysis',
        enabled: false,
        config: { scenarios: ['optimistic', 'base', 'pessimistic'], showComparison: true }
      }
    ];

    setReportSections(defaultSections);
  };

  const handleCountryToggle = (country: string, checked: boolean) => {
    if (checked) {
      setSelectedCountries(prev => [...prev, country]);
    } else {
      setSelectedCountries(prev => prev.filter(c => c !== country));
    }
  };

  const toggleSection = (sectionId: string, enabled: boolean) => {
    setReportSections(prev => 
      prev.map(section => 
        section.id === sectionId ? { ...section, enabled } : section
      )
    );
  };

  const updateSectionConfig = (sectionId: string, configKey: string, value: any) => {
    setReportSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, config: { ...section.config, [configKey]: value } }
          : section
      )
    );
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a template before generating the report",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get template details
      const template = templates.find(t => t.id === selectedTemplate);
      
      const reportConfig = {
        title: reportTitle,
        template_id: selectedTemplate,
        period: selectedPeriod === 'all' ? '' : selectedPeriod,
        countries: selectedCountries,
        sections: reportSections.filter(s => s.enabled),
        branding: template?.branding_config || {},
        chart_styles: template?.chart_styles || {},
        table_styles: template?.table_styles || {}
      };

      // Call enhanced report generation function
      const response = await supabase.functions.invoke('generate-advanced-report', {
        body: reportConfig
      });

      if (response.error) throw response.error;

      // Create report instance record
      const { data: reportInstance, error: instanceError } = await supabase
        .from('report_instances')
        .insert({
          template_id: selectedTemplate,
          title: reportTitle,
          generated_by: (await supabase.auth.getUser()).data.user?.id,
          configuration: reportConfig as any,
          status: 'completed',
          download_url: response.data?.downloadUrl
        })
        .select()
        .single();

      if (instanceError) throw instanceError;

      toast({
        title: "Report Generated",
        description: "Your Prima Finance report has been generated successfully.",
      });
      
      // Trigger download
      if (response.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
        link.click();
      } else {
        // Fallback: Create JSON download for development
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4" />;
      case 'overview': return <Target className="h-4 w-4" />;
      case 'country': return <MapPin className="h-4 w-4" />;
      case 'variance': return <TrendingUp className="h-4 w-4" />;
      case 'forecast': return <LineChart className="h-4 w-4" />;
      case 'costs': return <PieChart className="h-4 w-4" />;
      case 'scenario': return <BarChart3 className="h-4 w-4" />;
      default: return <Table2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Advanced Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-title">Report Title</Label>
                  <Input
                    id="report-title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: template.branding_config.primaryColor }}
                            />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All periods</SelectItem>
                      <SelectItem value="2024-01-01">2024 YTD</SelectItem>
                      <SelectItem value="2024-01-01">Q1 2024</SelectItem>
                      <SelectItem value="2024-04-01">Q2 2024</SelectItem>
                      <SelectItem value="2024-07-01">Q3 2024</SelectItem>
                      <SelectItem value="2024-10-01">Q4 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Countries to Include</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Italy', 'UK', 'Spain', 'France', 'Germany', 'Netherlands'].map((country) => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                          id={country}
                          checked={selectedCountries.includes(country)}
                          onCheckedChange={(checked) => handleCountryToggle(country, checked as boolean)}
                        />
                        <Label htmlFor={country} className="text-sm">{country}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sections" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {reportSections.map((section) => (
                    <Card key={section.id} className={`${section.enabled ? 'ring-1 ring-primary' : 'opacity-75'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={section.enabled}
                              onCheckedChange={(checked) => toggleSection(section.id, checked as boolean)}
                            />
                            {getSectionIcon(section.type)}
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {section.enabled && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {section.type === 'overview' && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={section.config.showKPIs}
                                    onCheckedChange={(checked) => updateSectionConfig(section.id, 'showKPIs', checked)}
                                  />
                                  <Label>Show KPIs</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={section.config.showCharts}
                                    onCheckedChange={(checked) => updateSectionConfig(section.id, 'showCharts', checked)}
                                  />
                                  <Label>Include Charts</Label>
                                </div>
                              </>
                            )}
                            
                            {section.type === 'forecast' && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-xs">Forecast Months:</Label>
                                  <Input
                                    type="number"
                                    value={section.config.forecastMonths}
                                    onChange={(e) => updateSectionConfig(section.id, 'forecastMonths', parseInt(e.target.value))}
                                    className="w-16 h-6"
                                    min="3"
                                    max="24"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={section.config.includeScenarios}
                                    onCheckedChange={(checked) => updateSectionConfig(section.id, 'includeScenarios', checked)}
                                  />
                                  <Label>Include Scenarios</Label>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Title:</span>
                      <span>{reportTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Period:</span>
                      <span>{selectedPeriod === 'all' ? 'All periods' : selectedPeriod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Countries:</span>
                      <div className="flex gap-1">
                        {selectedCountries.map(country => (
                          <Badge key={country} variant="secondary">{country}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Sections ({reportSections.filter(s => s.enabled).length}):</span>
                      <div className="mt-2 space-y-1">
                        {reportSections.filter(s => s.enabled).map((section, index) => (
                          <div key={section.id} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            {getSectionIcon(section.type)}
                            <span>{section.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={generateReport} 
              disabled={isGenerating || selectedCountries.length === 0 || !selectedTemplate}
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PowerPoint...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PowerPoint Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}