import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Palette, 
  Layout, 
  BarChart3, 
  Table2,
  X,
  Eye,
  Download,
  Edit
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  company_name: string;
  template_type: string;
  is_default: boolean;
  branding_config: any;
  slide_layouts: any[];
  chart_styles: any;
  table_styles: any;
  created_at: string;
}

interface TemplatePreviewProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (template: Template) => void;
  onUse?: (template: Template) => void;
}

export function TemplatePreview({ template, isOpen, onClose, onEdit, onUse }: TemplatePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!template) return null;

  const slides = template.slide_layouts || [];

  const renderSlidePreview = (layout: any, index: number) => {
    const backgroundColor = template.branding_config.backgroundColor || '#FFFFFF';
    const primaryColor = template.branding_config.primaryColor || '#003366';
    const secondaryColor = template.branding_config.secondaryColor || '#FF6B35';
    const textColor = template.branding_config.textColor || '#333333';

    return (
      <div 
        className="w-full h-64 border rounded-lg p-4 relative"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Header with logo position */}
        {template.branding_config.logoPosition === 'top-left' && (
          <div className="absolute top-4 left-4">
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}

        {/* Slide content based on type */}
        <div className="h-full flex flex-col justify-center items-center text-center">
          {layout.type === 'title' && (
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                {template.name}
              </h1>
              <p className="text-lg mb-4" style={{ color: secondaryColor }}>
                Prima Finance Presentation
              </p>
              <p className="text-sm opacity-75">
                {new Date().toLocaleDateString()}
              </p>
            </>
          )}

          {layout.type === 'overview' && (
            <>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                Executive Overview
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-md">
                <div className="bg-opacity-20 p-3 rounded text-center" style={{ backgroundColor: primaryColor }}>
                  <div className="text-lg font-bold">€2.4M</div>
                  <div className="text-xs opacity-75">Revenue</div>
                </div>
                <div className="bg-opacity-20 p-3 rounded text-center" style={{ backgroundColor: secondaryColor }}>
                  <div className="text-lg font-bold">+12%</div>
                  <div className="text-xs opacity-75">Growth</div>
                </div>
                <div className="bg-opacity-20 p-3 rounded text-center" style={{ backgroundColor: template.branding_config.accentColor }}>
                  <div className="text-lg font-bold">85%</div>
                  <div className="text-xs opacity-75">Target</div>
                </div>
              </div>
              <div className="w-full h-16 bg-opacity-10 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <BarChart3 className="h-8 w-8 opacity-50" />
                <span className="ml-2 text-sm opacity-75">[Chart Preview]</span>
              </div>
            </>
          )}

          {layout.type === 'country' && (
            <>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                Country Analysis
              </h2>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="space-y-2">
                  {['Italy', 'UK', 'Spain'].map((country) => (
                    <div key={country} className="flex justify-between items-center p-2 bg-opacity-10 rounded" style={{ backgroundColor: primaryColor }}>
                      <span className="text-sm">{country}</span>
                      <Badge variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-opacity-10 rounded flex items-center justify-center" style={{ backgroundColor: template.branding_config.accentColor }}>
                  <span className="text-xs opacity-75">[Map Preview]</span>
                </div>
              </div>
            </>
          )}

          {(layout.type === 'variance' || layout.type === 'analysis') && (
            <>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {layout.name}
              </h2>
              <div className="w-full max-w-md">
                <div className="bg-opacity-10 p-4 rounded mb-4" style={{ backgroundColor: primaryColor }}>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="font-medium">Metric</div>
                    <div className="font-medium">Actual</div>
                    <div className="font-medium">Variance</div>
                    <div>Revenue</div>
                    <div>€2.4M</div>
                    <div style={{ color: secondaryColor }}>+12%</div>
                    <div>Costs</div>
                    <div>€1.8M</div>
                    <div style={{ color: secondaryColor }}>-5%</div>
                  </div>
                </div>
                <div className="bg-opacity-10 rounded flex items-center justify-center h-16" style={{ backgroundColor: template.branding_config.accentColor }}>
                  <Table2 className="h-6 w-6 opacity-50" />
                  <span className="ml-2 text-xs opacity-75">[Table Preview]</span>
                </div>
              </div>
            </>
          )}

          {layout.type === 'forecast' && (
            <>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                Forecast & Trends
              </h2>
              <div className="w-full max-w-md bg-opacity-10 rounded p-4" style={{ backgroundColor: template.branding_config.accentColor }}>
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-opacity-30" style={{ borderColor: primaryColor }}>
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 opacity-50 mx-auto mb-2" />
                    <span className="text-xs opacity-75">Forecast Chart</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!['title', 'overview', 'country', 'variance', 'analysis', 'forecast'].includes(layout.type) && (
            <>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {layout.name || 'Slide Preview'}
              </h2>
              <div className="w-full max-w-md bg-opacity-10 rounded p-4 h-32 flex items-center justify-center" style={{ backgroundColor: template.branding_config.accentColor }}>
                <span className="text-sm opacity-75">[{layout.type} Preview]</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {template.branding_config.footerText && (
          <div className="absolute bottom-2 left-4 right-4 text-center">
            <p className="text-xs opacity-60">{template.branding_config.footerText}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {template.name} Preview
              </DialogTitle>
              <DialogDescription>
                {template.description} • {slides.length} slides • {template.template_type}
                {template.is_default && <Badge className="ml-2">Default</Badge>}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onUse && (
                <Button size="sm" onClick={() => onUse(template)}>
                  <Download className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-6 h-full">
          {/* Slide Navigation */}
          <div className="w-64 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Primary:</span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: template.branding_config.primaryColor }}
                  />
                  <span className="text-xs opacity-75">{template.branding_config.primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Secondary:</span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: template.branding_config.secondaryColor }}
                  />
                  <span className="text-xs opacity-75">{template.branding_config.secondaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Font:</span>
                  <span className="text-xs opacity-75">{template.branding_config.fontFamily}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Slides ({slides.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {slides.map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          currentSlide === index 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium">{index + 1}. {slide.name}</div>
                        <div className="text-muted-foreground mt-1 capitalize">{slide.type}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Separator orientation="vertical" />

          {/* Slide Preview */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                Slide {currentSlide + 1}: {slides[currentSlide]?.name || 'No slide selected'}
              </h3>
              <Badge variant="outline" className="text-xs capitalize">
                {slides[currentSlide]?.type || 'unknown'}
              </Badge>
            </div>
            
            {slides[currentSlide] && renderSlidePreview(slides[currentSlide], currentSlide)}
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} of {slides.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                disabled={currentSlide >= slides.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}