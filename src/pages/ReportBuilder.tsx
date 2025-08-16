import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Settings, Undo2, Redo2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SlidesPanel } from '@/components/reports/SlidesPanel';
import { SlidePreview } from '@/components/reports/SlidePreview';
import { AskJudeChat } from '@/components/reports/AskJudeChat';
import { DataVisualizationChat } from '@/components/reports/DataVisualizationChat';
import { FinancialRatiosManager } from '@/components/finance/FinancialRatiosManager';

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
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showRatiosManager, setShowRatiosManager] = useState(false);
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
      const reportConfig = {
        title: slides.find(s => s.type === 'title')?.title || 'Prima Finance Report',
        template_id: template.id,
        slides: slides,
        filters: globalFilters,
        branding: {
          primaryColor: template.primary_color,
          secondaryColor: template.secondary_color,
          accentColor: template.accent_color,
          fontFamily: template.heading_font
        }
      };

      const response = await supabase.functions.invoke('generate-advanced-report', {
        body: reportConfig
      });

      if (response.error) throw response.error;

      // Try to save report instance if possible, but don't block generation
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('report_instances')
            .insert({
              template_id: template.id,
              title: reportConfig.title,
              generated_by: user.id,
              configuration: reportConfig as any,
              status: 'completed',
              download_url: response.data?.downloadUrl
            });
        }
      } catch (dbError) {
        console.log('Could not save to database, but report generated successfully');
      }

      toast({
        title: "Report Generated",
        description: "Your PowerPoint report has been generated successfully",
      });

      // Trigger download
      if (response.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `${reportConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

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
            <Button variant="outline" size="sm" onClick={() => setShowRatiosManager(true)}>
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

      {/* Financial Ratios Manager Modal */}
      {showRatiosManager && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg rounded-lg border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Financial Ratios Manager</h2>
              <Button variant="outline" onClick={() => setShowRatiosManager(false)}>
                Close
              </Button>
            </div>
            <FinancialRatiosManager />
          </div>
        </div>
      )}
    </div>
  );
}