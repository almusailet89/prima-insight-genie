import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Share2, MessageSquare } from 'lucide-react';
import { AskJudeModal } from '@/components/ask-jude/AskJudeModal';

interface ReportPreviewProps {
  reportConfig: any;
  template: any;
}

export function ReportPreview({ reportConfig, template }: ReportPreviewProps) {
  const [showJude, setShowJude] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = reportConfig.sections?.filter((s: any) => s.enabled) || [];

  const getSlidePreview = (section: any, index: number) => {
    switch (section.type) {
      case 'title':
        return (
          <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/20 rounded-lg p-6 flex flex-col justify-center items-center text-center">
            <h1 className="text-2xl font-bold mb-2">{reportConfig.title}</h1>
            <p className="text-muted-foreground">Prima Finance Report</p>
            <p className="text-sm text-muted-foreground mt-2">{new Date().toLocaleDateString()}</p>
          </div>
        );
      
      case 'overview':
        return (
          <div className="h-48 bg-background border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-primary/5 p-3 rounded text-center">
                <div className="text-xl font-bold text-primary">€2.4M</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div className="bg-green-500/5 p-3 rounded text-center">
                <div className="text-xl font-bold text-green-600">+12%</div>
                <div className="text-xs text-muted-foreground">Growth</div>
              </div>
              <div className="bg-orange-500/5 p-3 rounded text-center">
                <div className="text-xl font-bold text-orange-600">85%</div>
                <div className="text-xs text-muted-foreground">Target</div>
              </div>
            </div>
            <div className="h-16 bg-muted/30 rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">[Chart Preview]</span>
            </div>
          </div>
        );
      
      case 'country':
        return (
          <div className="h-48 bg-background border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {reportConfig.countries?.slice(0, 3).map((country: string) => (
                  <div key={country} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                    <span className="text-sm">{country}</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                ))}
              </div>
              <div className="bg-muted/30 rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">[Map Preview]</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-48 bg-background border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="h-32 bg-muted/30 rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">[{section.type} Preview]</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Report Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {slides.length} slides • Template: {template?.name || 'Default'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowJude(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Jude
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Preview
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Report Preview</DialogTitle>
                    <DialogDescription>
                      Generate a shareable link for this report preview
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Share this preview with stakeholders before generating the final report.
                    </p>
                    <Button className="w-full">Generate Share Link</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Slide Navigation */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Slides</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {slides.map((slide: any, index: number) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        currentSlide === index 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{index + 1}. {slide.title}</div>
                      <div className="text-muted-foreground mt-1">{slide.type}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator orientation="vertical" className="h-64" />

            {/* Slide Preview */}
            <div className="col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Slide {currentSlide + 1}: {slides[currentSlide]?.title || 'No slide selected'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {slides[currentSlide]?.type || 'unknown'}
                  </Badge>
                </div>
                
                {slides[currentSlide] && getSlidePreview(slides[currentSlide], currentSlide)}
                
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
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
          </div>
        </CardContent>
      </Card>

      <AskJudeModal 
        open={showJude} 
        onOpenChange={setShowJude}
      />
    </div>
  );
}