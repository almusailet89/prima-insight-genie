import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  FileText, 
  List,
  TrendingUp,
  BarChart3,
  LineChart,
  Target,
  PieChart,
  Table2,
  MessageSquare,
  GripVertical,
  Copy,
  Trash2
} from 'lucide-react';

interface SlidesPanel {
  slides: any[];
  activeSlideId: string;
  onSlideSelect: (slideId: string) => void;
  onSlideAdd: (slideType: string) => void;
  onSlideDelete: (slideId: string) => void;
  onSlideDuplicate: (slideId: string) => void;
  onSlideReorder: (fromIndex: number, toIndex: number) => void;
}

export function SlidesPanel({ 
  slides, 
  activeSlideId, 
  onSlideSelect, 
  onSlideAdd, 
  onSlideDelete, 
  onSlideDuplicate,
  onSlideReorder 
}: SlidesPanel) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const slideTypes = [
    { type: 'title', label: 'Title (Prima)', icon: FileText, description: 'Prima branded title slide' },
    { type: 'agenda', label: 'Agenda', icon: List, description: 'Auto-generated from slides' },
    { type: 'kpi', label: 'KPI Overview', icon: TrendingUp, description: 'Key performance indicators' },
    { type: 'variance', label: 'Variance', icon: BarChart3, description: 'Actual vs budget analysis' },
    { type: 'sales', label: 'Sales', icon: Target, description: 'Sales trends and metrics' },
    { type: 'forecast', label: 'Forecast', icon: LineChart, description: 'Future projections' },
    { type: 'scenario', label: 'Scenario', icon: PieChart, description: 'Scenario analysis' },
    { type: 'narrative', label: 'Narrative', icon: MessageSquare, description: 'Text and insights' },
    { type: 'table', label: 'Table', icon: Table2, description: 'Data tables' },
    { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Custom charts' },
    { type: 'blank', label: 'Blank', icon: FileText, description: 'Empty slide' }
  ];

  const getSlideIcon = (type: string) => {
    const slideType = slideTypes.find(st => st.type === type);
    return slideType ? slideType.icon : FileText;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onSlideReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="w-80 bg-card border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3">Slides</h2>
        
        {/* Add Slide Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {slideTypes.slice(0, 6).map((slideType) => {
            const Icon = slideType.icon;
            return (
              <Button
                key={slideType.type}
                variant="outline"
                size="sm"
                onClick={() => onSlideAdd(slideType.type)}
                className="justify-start text-xs h-8"
              >
                <Icon className="h-3 w-3 mr-1" />
                {slideType.label}
              </Button>
            );
          })}
        </div>
        
        {/* More buttons */}
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            More slide types...
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {slideTypes.slice(6).map((slideType) => {
              const Icon = slideType.icon;
              return (
                <Button
                  key={slideType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => onSlideAdd(slideType.type)}
                  className="justify-start text-xs h-8"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {slideType.label}
                </Button>
              );
            })}
          </div>
        </details>
      </div>

      {/* Slides List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No slides yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first slide above</p>
            </div>
          ) : (
            slides.map((slide, index) => {
              const Icon = getSlideIcon(slide.type);
              const isActive = slide.id === activeSlideId;
              
              return (
                <Card
                  key={slide.id}
                  className={`cursor-pointer transition-colors ${
                    isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => onSlideSelect(slide.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-primary" />
                          <Badge variant="outline" className="text-xs">
                            {slide.type}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm truncate">
                          {slide.title || `${slide.type} Slide`}
                        </h4>
                        
                        {slide.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Slide Actions */}
                    <div className="flex justify-end gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlideDuplicate(slide.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlideDelete(slide.id);
                        }}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}