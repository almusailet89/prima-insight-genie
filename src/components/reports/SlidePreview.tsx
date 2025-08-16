import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Table2,
  Edit3,
  Calendar,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SlidePreviewProps {
  slide: any;
  template: any;
  globalFilters: any;
  onSlideUpdate: (slideId: string, updates: any) => void;
}

export function SlidePreview({ slide, template, globalFilters, onSlideUpdate }: SlidePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localSlide, setLocalSlide] = useState(slide);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    setLocalSlide(slide);
    if (slide.type === 'kpi' || slide.type === 'variance' || slide.type === 'sales' || slide.type === 'forecast') {
      fetchSlideData();
    }
  }, [slide, globalFilters]);

  const fetchSlideData = async () => {
    try {
      let query = supabase.from('forecast_gwp').select('*');
      
      // Apply global filters
      if (globalFilters.countries?.length > 0) {
        query = query.in('country', globalFilters.countries);
      }
      
      if (globalFilters.period?.from) {
        query = query.gte('month', globalFilters.period.from);
      }
      
      if (globalFilters.period?.to) {
        query = query.lte('month', globalFilters.period.to);
      }

      const { data, error } = await query.order('month', { ascending: true });
      
      if (error) throw error;
      
      setChartData(data || []);
      setTableData(data || []);
    } catch (error) {
      console.error('Error fetching slide data:', error);
    }
  };

  const handleSave = () => {
    onSlideUpdate(slide.id, localSlide);
    setIsEditing(false);
  };

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4" />;
      case 'kpi': return <TrendingUp className="h-4 w-4" />;
      case 'variance': return <BarChart3 className="h-4 w-4" />;
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'table': return <Table2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const renderSlideContent = () => {
    const primaryColor = template?.primary_color || '#003366';
    const secondaryColor = template?.secondary_color || '#FF6B35';
    const accentColor = template?.accent_color || '#E8F4FD';
    
    switch (slide.type) {
      case 'title':
        return (
          <div 
            className="h-64 flex flex-col justify-center items-center text-center p-8"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white'
            }}
          >
            {isEditing ? (
              <div className="space-y-4 w-full max-w-md">
                <Input
                  value={localSlide.title || ''}
                  onChange={(e) => setLocalSlide(prev => ({ ...prev, title: e.target.value }))}
                  className="text-center text-xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  placeholder="Slide Title"
                />
                <Input
                  value={localSlide.subtitle || ''}
                  onChange={(e) => setLocalSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="text-center bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  placeholder="Subtitle"
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">{slide.title || 'Prima Finance Report'}</h1>
                <p className="text-lg opacity-90">{slide.subtitle || 'Financial Analysis & Insights'}</p>
                <div className="mt-4 text-sm opacity-75">
                  {new Date().toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        );

      case 'kpi':
        const kpis = slide.config?.kpis || ['Revenue', 'EBITDA', 'GWP', 'Contracts'];
        return (
          <div className="p-6">
            {isEditing ? (
              <Input
                value={localSlide.title || ''}
                onChange={(e) => setLocalSlide(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-bold mb-4"
                placeholder="KPI Overview Title"
              />
            ) : (
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {slide.title || 'Key Performance Indicators'}
              </h2>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {kpis.map((kpi, index) => {
                const value = chartData.reduce((sum, item) => sum + (parseFloat(item.gwp) || 0), 0);
                return (
                  <div 
                    key={kpi}
                    className="p-4 rounded-lg border"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div className="text-sm text-muted-foreground">{kpi}</div>
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {kpi === 'Revenue' || kpi === 'GWP' ? 
                        `€${(value / 1000000).toFixed(1)}M` : 
                        `${(value / 1000).toFixed(0)}K`
                      }
                    </div>
                    <div className="text-sm text-green-600">↗ +12.5%</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'variance':
        return (
          <div className="p-6">
            {isEditing ? (
              <Input
                value={localSlide.title || ''}
                onChange={(e) => setLocalSlide(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-bold mb-4"
                placeholder="Variance Analysis Title"
              />
            ) : (
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {slide.title || 'Variance Analysis'}
              </h2>
            )}
            
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead style={{ backgroundColor: primaryColor, color: 'white' }}>
                    <tr>
                      <th className="p-2 text-left text-sm">Country</th>
                      <th className="p-2 text-right text-sm">Actual</th>
                      <th className="p-2 text-right text-sm">Budget</th>
                      <th className="p-2 text-right text-sm">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.slice(0, 5).map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-2 text-sm">{row.country}</td>
                        <td className="p-2 text-right text-sm">€{(parseFloat(row.gwp) / 1000).toFixed(0)}K</td>
                        <td className="p-2 text-right text-sm">€{((parseFloat(row.gwp) * 0.95) / 1000).toFixed(0)}K</td>
                        <td className="p-2 text-right text-sm text-green-600">
                          +{(((parseFloat(row.gwp) - parseFloat(row.gwp) * 0.95) / (parseFloat(row.gwp) * 0.95)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={localSlide.title || ''}
                  onChange={(e) => setLocalSlide(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-bold"
                  placeholder="Chart Title"
                />
                <Select
                  value={localSlide.config?.chart?.type || 'line'}
                  onValueChange={(value) => setLocalSlide(prev => ({
                    ...prev,
                    config: { ...prev.config, chart: { ...prev.config?.chart, type: value } }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  {slide.title || 'Chart Analysis'}
                </h2>
                <div 
                  className="h-48 rounded-lg border flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" style={{ color: primaryColor }} />
                    <p className="text-sm text-muted-foreground">
                      {slide.config?.chart?.type || 'Line'} Chart Preview
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chartData.length} data points
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'narrative':
        return (
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={localSlide.title || ''}
                  onChange={(e) => setLocalSlide(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-bold"
                  placeholder="Narrative Title"
                />
                <Textarea
                  value={localSlide.content || ''}
                  onChange={(e) => setLocalSlide(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter narrative content..."
                  rows={8}
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  {slide.title || 'Executive Summary'}
                </h2>
                <div className="prose prose-sm max-w-none">
                  {slide.content ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {slide.content}
                    </pre>
                  ) : (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Key performance indicators show strong growth across all regions</p>
                      <p>• Revenue targets exceeded by 12.5% in Q3 driven by Italy and UK markets</p>
                      <p>• Cost management initiatives delivered €2.1M in savings</p>
                      <p>• Forecast outlook remains positive with continued growth expected</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Slide content preview</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Slide Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            {getSlideIcon(slide.type)}
            <span className="font-medium">{slide.title || `${slide.type} Slide`}</span>
            <Badge variant="outline" className="text-xs">
              {slide.type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {globalFilters.countries && (
              <Badge variant="secondary" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {globalFilters.countries.join(', ')}
              </Badge>
            )}
            {globalFilters.period?.from && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {globalFilters.period.from}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Slide Content */}
        <div className="bg-white border border-gray-200">
          {renderSlideContent()}
        </div>
      </CardContent>
    </Card>
  );
}