import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Settings, Undo2, Redo2, Save, FileDown } from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SlidesPanel } from '@/components/reports/SlidesPanel';
import { SlidePreview } from '@/components/reports/SlidePreview';
import { AskJudeChat } from '@/components/reports/AskJudeChat';
import { DataVisualizationChat } from '@/components/reports/DataVisualizationChat';


interface Template {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
}

interface Slide {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  config?: any;
  order: number;
}

interface GlobalFilters {
  countries: string[];
  departments: string[];
  period: {
    from: string;
    to: string;
  };
}

export default function ReportBuilder() {
  const [template, setTemplate] = useState<Template | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string>('');
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({
    countries: ['Italy', 'UK', 'Spain'],
    departments: [],
    period: { from: '2024-01-01', to: '2024-12-31' }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [activePanel, setActivePanel] = useState<'jude' | 'visualization'>('visualization');
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveTemplate();
    // Initialize with title slide
    if (slides.length === 0) {
      addSlide('title');
    }
  }, []);

  const fetchActiveTemplate = async () => {
    try {
      // Get active template from localStorage
      const activeTemplateId = localStorage.getItem('active_template_id');
      
      if (activeTemplateId) {
        const { data: templateData } = await supabase
          .from('report_templates')
          .select('*')
          .eq('id', activeTemplateId)
          .single();

        if (templateData) {
          setTemplate(templateData);
        }
      }
    } catch (error) {
      console.error('Error fetching active template:', error);
    }
  };

  const saveToHistory = (newSlides: Slide[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newSlides]);
    setHistory(newHistory.slice(-20)); // Keep last 20 operations
    setHistoryIndex(newHistory.length - 1);
  };

  const addSlide = (slideType: string) => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      type: slideType,
      title: getDefaultTitle(slideType),
      order: slides.length,
      config: getDefaultConfig(slideType)
    };

    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideId(newSlide.id);
    saveToHistory(newSlides);
  };

  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case 'title': return 'Prima Finance Report';
      case 'agenda': return 'Agenda';
      case 'kpi': return 'Key Performance Indicators';
      case 'variance': return 'Variance Analysis';
      case 'sales': return 'Sales Performance';
      case 'forecast': return 'Forecast & Projections';
      case 'scenario': return 'Scenario Analysis';
      case 'narrative': return 'Executive Summary';
      case 'table': return 'Data Analysis';
      case 'chart': return 'Trend Analysis';
      default: return 'Slide';
    }
  };

  const getDefaultConfig = (type: string): any => {
    switch (type) {
      case 'kpi':
        return { kpis: ['Revenue', 'EBITDA', 'GWP', 'Contracts'] };
      case 'variance':
        return { columns: ['account', 'actual', 'budget', 'abs_var', 'pct_var'], topN: 10 };
      case 'chart':
        return { chart: { type: 'line', x: 'month', y: ['gwp'] } };
      case 'forecast':
        return { forecastMonths: 12, showConfidenceInterval: true };
      default:
        return {};
    }
  };

  const deleteSlide = (slideId: string) => {
    const newSlides = slides.filter(s => s.id !== slideId);
    setSlides(newSlides);
    
    if (activeSlideId === slideId && newSlides.length > 0) {
      setActiveSlideId(newSlides[0].id);
    }
    
    saveToHistory(newSlides);
  };

  const duplicateSlide = (slideId: string) => {
    const slideIndex = slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    const originalSlide = slides[slideIndex];
    const newSlide: Slide = {
      ...originalSlide,
      id: crypto.randomUUID(),
      title: `${originalSlide.title} (Copy)`,
      order: slides.length
    };

    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideId(newSlide.id);
    saveToHistory(newSlides);
  };

  const reorderSlides = (fromIndex: number, toIndex: number) => {
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    
    // Update order
    newSlides.forEach((slide, index) => {
      slide.order = index;
    });
    
    setSlides(newSlides);
    saveToHistory(newSlides);
  };

  const updateSlide = (slideId: string, updates: any) => {
    const newSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, ...updates } : slide
    );
    setSlides(newSlides);
    saveToHistory(newSlides);
  };

  const handleSlideAction = (action: any) => {
    try {
      switch (action.intent) {
        case 'add':
          addSlide(action.slideType || 'blank');
          break;
        case 'edit':
          if (action.targetIndex !== null && slides[action.targetIndex]) {
            updateSlide(slides[action.targetIndex].id, action.params);
          }
          break;
        case 'delete':
          if (action.targetIndex !== null && slides[action.targetIndex]) {
            deleteSlide(slides[action.targetIndex].id);
          }
          break;
        case 'reorder':
          if (action.fromIndex !== null && action.toIndex !== null) {
            reorderSlides(action.fromIndex, action.toIndex);
          }
          break;
        default:
          console.log('Unknown slide action:', action);
      }
    } catch (error) {
      console.error('Error handling slide action:', error);
      toast({
        title: "Action Failed",
        description: "Failed to apply the requested change",
        variant: "destructive",
      });
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSlides([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSlides([...history[historyIndex + 1]]);
    }
  };

  const generateReport = async () => {
    if (!template) {
      toast({
        title: "No Template",
        description: "Please set an active template in the Templates page",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate comprehensive report data using new Prima PPT generator
      const { PrimaPPTGenerator } = await import('@/lib/ppt-generator');
      
      const reportData = {
        title: slides.find(s => s.type === 'title')?.title || 'Prima Finance Report',
        subtitle: `Professional Financial Analysis • ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}`,
        slides: slides.map(slide => ({
          type: slide.type as any,
          title: slide.title || 'Slide',
          content: slide.content,
          data: generateMockDataForSlide(slide),
          commentary: generateMockCommentary(slide)
        })),
        metadata: {
          generatedAt: new Date().toISOString(),
          author: 'Prima Finance Team',
          department: 'Finance Department'
        }
      };

      const pptGenerator = new PrimaPPTGenerator();
      const pptx = pptGenerator.generateReport(reportData);
      
      const filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
      await pptGenerator.downloadPPT(filename);
      
      toast({
        title: "Professional PowerPoint Generated",
        description: "Your Prima Finance report has been generated with professional branding.",
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockDataForSlide = (slide: Slide) => {
    switch (slide.type) {
      case 'kpi':
        return [
          { name: 'Revenue', current: 2650000, previous: 2450000, variance: 0.082 },
          { name: 'Operating Margin', current: 0.186, previous: 0.175, variance: 0.063 },
          { name: 'Net Income', current: 492500, previous: 428750, variance: 0.149 }
        ];
      case 'variance':
        return [
          { department: 'Motor Insurance', actual: 1380000, budget: 1320000, variance: 60000, variancePercent: 0.045 },
          { department: 'Home Insurance', actual: 820000, budget: 850000, variance: -30000, variancePercent: -0.035 }
        ];
      case 'forecast':
        return [{ totalRevenue: 2950000, avgGrowth: 0.089 }];
      default:
        return [];
    }
  };

  const generateMockCommentary = (slide: Slide) => {
    switch (slide.type) {
      case 'kpi':
        return "Strong performance across key metrics with revenue growth of 8.2% and improved operational efficiency.";
      case 'variance':
        return "Motor insurance exceeds budget by 4.5% while home insurance faces competitive pressures.";
      case 'forecast':
        return "Full year forecast projects continued growth with strategic market expansion initiatives.";
      default:
        return `Professional analysis for ${slide.title} with data-driven insights.`;
    }
  };

  const downloadPPT = async () => {
    if (!template) {
      toast({
        title: "No Template",
        description: "Please set an active template in the Templates page",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const pres = new PptxGenJS();
      
      // Set presentation properties with Prima branding
      pres.author = 'Prima Assicurazioni';
      pres.company = 'Prima';
      pres.revision = '1';
      pres.title = slides.find(s => s.type === 'title')?.title || 'Prima Finance Report';
      pres.subject = 'Financial Analysis Report';

      // Define Prima color scheme
      const primaColors = {
        primary: '#003366',
        secondary: '#FF6B35', 
        accent: '#E8F4FD',
        text: '#2D3748',
        lightGray: '#F7FAFC'
      };

      // Master layout settings
      const layoutOpts = {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 6.5,
        margin: 0.5
      };

      // Generate slides based on JSON structure
      slides.forEach((slide, index) => {
        const pptSlide = pres.addSlide();

        switch (slide.type) {
          case 'title':
            generateTitleSlide(pptSlide, slide, primaColors);
            break;
          case 'kpi':
            generateKPISlide(pptSlide, slide, primaColors, globalFilters);
            break;
          case 'variance':
            generateVarianceSlide(pptSlide, slide, primaColors, globalFilters);
            break;
          case 'forecast':
            generateForecastSlide(pptSlide, slide, primaColors, globalFilters);
            break;
          case 'narrative':
            generateNarrativeSlide(pptSlide, slide, primaColors);
            break;
          case 'table':
            generateTableSlide(pptSlide, slide, primaColors, globalFilters);
            break;
          case 'chart':
            generateChartSlide(pptSlide, slide, primaColors, globalFilters);
            break;
          default:
            generateGenericSlide(pptSlide, slide, primaColors);
        }
      });

      // Generate and download
      const fileName = `Prima_Monthly_Report_${new Date().toISOString().split('T')[0]}.pptx`;
      await pres.writeFile({ fileName });

      toast({
        title: "Download Successful",
        description: "PowerPoint file has been downloaded successfully",
      });

    } catch (error) {
      console.error('Error downloading PPT:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper functions for slide generation
  const generateTitleSlide = (slide: any, slideData: Slide, colors: any) => {
    slide.background = { fill: colors.primary };
    
    // Prima logo placeholder (you can add actual logo later)
    slide.addText('PRIMA', {
      x: 0.5,
      y: 1,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Segoe UI',
      align: 'center'
    });

    // Main title
    slide.addText(slideData.title || 'Prima Finance Report', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 32,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Segoe UI',
      align: 'center'
    });

    // Subtitle
    slide.addText(slideData.subtitle || 'Financial Performance Analysis', {
      x: 0.5,
      y: 4,
      w: 9,
      h: 1,
      fontSize: 18,
      color: colors.accent,
      fontFace: 'Segoe UI',
      align: 'center'
    });

    // Date
    slide.addText(new Date().toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: colors.accent,
      fontFace: 'Segoe UI',
      align: 'center'
    });
  };

  const generateKPISlide = (slide: any, slideData: Slide, colors: any, filters: GlobalFilters) => {
    slide.background = { fill: 'FFFFFF' };
    
    // Title
    slide.addText(slideData.title || 'Key Performance Indicators', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    // Mock KPI data
    const kpiData = [
      ['Metric', 'Current', 'Target', 'Variance'],
      ['GWP (€M)', '45.2', '42.0', '+7.6%'],
      ['Claims Ratio', '68.5%', '70.0%', '-1.5%'],
      ['Operating Ratio', '92.1%', '95.0%', '-2.9%'],
      ['Revenue (€M)', '52.8', '50.0', '+5.6%']
    ];

    slide.addTable(kpiData, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 3,
      fontSize: 12,
      fontFace: 'Segoe UI',
      color: colors.text,
      border: { pt: 1, color: colors.primary },
      fill: { color: colors.lightGray },
      rowH: 0.6
    });

    // Commentary
    slide.addText(slideData.content || 'Strong performance across key metrics with GWP exceeding targets by 7.6%. Claims ratio remains well-controlled below target levels.', {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 1.5,
      fontSize: 12,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  };

  const generateVarianceSlide = (slide: any, slideData: Slide, colors: any, filters: GlobalFilters) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Variance Analysis', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    const varianceData = [
      ['Department', 'Actual (€M)', 'Budget (€M)', 'Variance (€M)', 'Variance %'],
      ['Motor Insurance', '28.5', '26.0', '+2.5', '+9.6%'],
      ['Home Insurance', '12.3', '13.0', '-0.7', '-5.4%'],
      ['Commercial', '8.7', '8.5', '+0.2', '+2.4%'],
      ['Life Insurance', '6.2', '5.5', '+0.7', '+12.7%']
    ];

    slide.addTable(varianceData, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 3,
      fontSize: 11,
      fontFace: 'Segoe UI',
      color: colors.text,
      border: { pt: 1, color: colors.primary },
      fill: { color: colors.lightGray },
      rowH: 0.6
    });

    slide.addText('Motor Insurance shows strongest positive variance (+9.6%) while Home Insurance is slightly below budget. Overall portfolio performance remains strong.', {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 1.5,
      fontSize: 12,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  };

  const generateForecastSlide = (slide: any, slideData: Slide, colors: any, filters: GlobalFilters) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Forecast Summary', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    const forecastData = [
      ['Period', 'Forecast GWP (€M)', 'Growth %', 'Confidence'],
      ['Q1 2025', '47.3', '+4.6%', '89%'],
      ['Q2 2025', '49.1', '+8.6%', '85%'],
      ['Q3 2025', '51.2', '+13.3%', '78%'],
      ['Q4 2025', '52.8', '+16.8%', '72%']
    ];

    slide.addTable(forecastData, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 3,
      fontSize: 11,
      fontFace: 'Segoe UI',
      color: colors.text,
      border: { pt: 1, color: colors.primary },
      fill: { color: colors.lightGray },
      rowH: 0.6
    });

    slide.addText('Forecast shows continued growth trajectory with average quarterly growth of 10.8%. Confidence levels remain strong in near-term projections.', {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 1.5,
      fontSize: 12,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  };

  const generateNarrativeSlide = (slide: any, slideData: Slide, colors: any) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Executive Summary', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    const content = slideData.content || `Prima Assicurazioni demonstrates strong financial performance across all key metrics this period. 

• GWP growth of 7.6% exceeds targets, driven by motor insurance expansion
• Claims ratio remains well-controlled at 68.5%, below the 70% target
• Operating efficiency improvements result in 92.1% operating ratio
• Revenue growth of 5.6% supports continued expansion plans

The outlook remains positive with forecasted growth continuing into 2025, supported by market expansion and product diversification strategies.`;

    slide.addText(content, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5,
      fontSize: 14,
      color: colors.text,
      fontFace: 'Segoe UI',
      lineSpacing: 20
    });
  };

  const generateTableSlide = (slide: any, slideData: Slide, colors: any, filters: GlobalFilters) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Data Analysis', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    // Generate country breakdown based on selected countries
    const countryData = [['Country', 'GWP (€M)', 'Claims (€M)', 'Profit (€M)']];
    filters.countries.forEach(country => {
      const gwp = (Math.random() * 20 + 10).toFixed(1);
      const claims = (parseFloat(gwp) * 0.7).toFixed(1);
      const profit = (parseFloat(gwp) * 0.15).toFixed(1);
      countryData.push([country, gwp, claims, profit]);
    });

    slide.addTable(countryData, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 3,
      fontSize: 12,
      fontFace: 'Segoe UI',
      color: colors.text,
      border: { pt: 1, color: colors.primary },
      fill: { color: colors.lightGray },
      rowH: 0.6
    });

    slide.addText('Country-level performance breakdown showing regional contribution to overall results.', {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 1,
      fontSize: 12,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  };

  const generateChartSlide = (slide: any, slideData: Slide, colors: any, filters: GlobalFilters) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Trend Analysis', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    // Add chart placeholder (PptxGenJS supports basic charts)
    slide.addText('📈 Chart: Growth Trend Analysis', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 2,
      fontSize: 48,
      color: colors.primary,
      fontFace: 'Segoe UI',
      align: 'center'
    });

    slide.addText('Monthly GWP growth showing consistent upward trend across all markets with Q4 acceleration.', {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 1,
      fontSize: 12,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  };

  const generateGenericSlide = (slide: any, slideData: Slide, colors: any) => {
    slide.background = { fill: 'FFFFFF' };
    
    slide.addText(slideData.title || 'Slide', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      fontFace: 'Segoe UI'
    });

    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 0.6,
        fontSize: 16,
        color: colors.text,
        fontFace: 'Segoe UI'
      });
    }

    if (slideData.content) {
      slide.addText(slideData.content, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 4,
        fontSize: 14,
        color: colors.text,
        fontFace: 'Segoe UI'
      });
    }
  };

  const handleCountryToggle = (country: string, checked: boolean) => {
    if (checked) {
      setGlobalFilters(prev => ({
        ...prev,
        countries: [...prev.countries, country]
      }));
    } else {
      setGlobalFilters(prev => ({
        ...prev,
        countries: prev.countries.filter(c => c !== country)
      }));
    }
  };

  const activeSlide = slides.find(s => s.id === activeSlideId);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              No Active Template
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please set an active template before building reports.
            </p>
            <Button onClick={() => window.location.href = '/templates'}>
              Go to Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Report Builder</h1>
          <Badge variant="outline" className="text-xs">
            {template.name}
          </Badge>
        </div>

        {/* Global Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Label>Countries:</Label>
            {['Italy', 'UK', 'Spain', 'France', 'Germany'].map((country) => (
              <div key={country} className="flex items-center space-x-1">
                <Checkbox
                  id={country}
                  checked={globalFilters.countries.includes(country)}
                  onCheckedChange={(checked) => handleCountryToggle(country, checked as boolean)}
                />
                <Label htmlFor={country} className="text-xs">{country}</Label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/ratios'}>
              <Settings className="h-4 w-4 mr-1" />
              Ratios
            </Button>
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={generateReport} disabled={isGenerating || slides.length === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PPT
              </>
            )}
          </Button>
          
          <Button onClick={downloadPPT} disabled={isDownloading || slides.length === 0} variant="outline">
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download PPT
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Slides Panel */}
        <SlidesPanel
          slides={slides}
          activeSlideId={activeSlideId}
          onSlideSelect={setActiveSlideId}
          onSlideAdd={addSlide}
          onSlideDelete={deleteSlide}
          onSlideDuplicate={duplicateSlide}
          onSlideReorder={reorderSlides}
        />

        {/* Center: Slide Preview */}
        <div className="flex-1 p-4 overflow-auto bg-muted/50">
          {activeSlide ? (
            <SlidePreview
              slide={activeSlide}
              template={template}
              globalFilters={globalFilters}
              onSlideUpdate={updateSlide}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-muted-foreground">Select a slide to preview</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Enhanced Chat Panel */}
        <div className="w-96 p-4 border-l bg-background flex flex-col">
          {/* Panel Toggle */}
          <div className="flex mb-4 bg-muted rounded-lg p-1">
            <Button
              variant={activePanel === 'visualization' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setActivePanel('visualization')}
            >
              Charts & Data
            </Button>
            <Button
              variant={activePanel === 'jude' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setActivePanel('jude')}
            >
              Ask Jude
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1">
            {activePanel === 'visualization' ? (
              <DataVisualizationChat
                onSlideAction={handleSlideAction}
                currentSlides={slides}
                globalFilters={globalFilters}
              />
            ) : (
              <AskJudeChat
                onSlideAction={handleSlideAction}
                currentSlides={slides}
                globalFilters={globalFilters}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}