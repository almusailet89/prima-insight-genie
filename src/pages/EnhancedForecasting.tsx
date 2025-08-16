import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { 
  TrendingUp, 
  Calculator, 
  Target, 
  BarChart3, 
  Settings,
  Calendar,
  Building2,
  MapPin,
  Package,
  Users,
  Filter
} from 'lucide-react';

interface ForecastParams {
  measures: string[];
  markets: string[];
  products: string[];
  channels: string[];
  costCenters: string[];
  timePeriod: 'weekly' | 'monthly' | 'quarterly';
  forecastMethod: 'linear' | 'exponential' | 'seasonal';
  growthAssumptions: Record<string, number>;
  seasonalFactors: Record<string, number>;
  confidenceInterval: number;
}

interface DimensionOption {
  id: string;
  name: string;
  department?: string;
  country?: string;
  code?: string;
}

export default function EnhancedForecasting() {
  const [forecastParams, setForecastParams] = useState<ForecastParams>({
    measures: ['Revenue', 'GWP', 'Claims'],
    markets: [],
    products: [],
    channels: [],
    costCenters: [],
    timePeriod: 'monthly',
    forecastMethod: 'linear',
    growthAssumptions: {},
    seasonalFactors: {},
    confidenceInterval: 95,
  });

  const [dimensions, setDimensions] = useState({
    markets: [] as DimensionOption[],
    products: [] as DimensionOption[],
    channels: [] as DimensionOption[],
    costCenters: [] as DimensionOption[],
  });

  const [forecastResults, setForecastResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>(['Revenue']);

  const availableMeasures = [
    'Revenue', 'GWP', 'Claims', 'Premium_Earned', 'Operating_Expenses',
    'COGS', 'Opex', 'EBITDA', 'Net_Income', 'Investment_Income'
  ];

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      const [marketsRes, productsRes, channelsRes, costCentersRes] = await Promise.all([
        supabase.from('dim_markets').select('id, country'),
        supabase.from('dim_products').select('id, name'),
        supabase.from('dim_channels').select('id, name'),
        supabase.from('dim_cost_centers').select('id, code, name, department')
      ]);

      setDimensions({
        markets: (marketsRes.data || []).map((m: any) => ({ id: m.id, name: m.country })),
        products: (productsRes.data || []).map((p: any) => ({ id: p.id, name: p.name })),
        channels: (channelsRes.data || []).map((c: any) => ({ id: c.id, name: c.name })),
        costCenters: (costCentersRes.data || []).map((cc: any) => ({
          id: cc.id,
          name: `${cc.code} - ${cc.name}`,
          department: cc.department,
          code: cc.code
        })),
      });
    } catch (error) {
      console.error('Error loading dimensions:', error);
    }
  };

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      // Simulate forecast generation with enhanced parameters
      const mockResults = selectedMeasures.map(measure => {
        const baseValue = Math.random() * 1000000 + 500000;
        const growth = forecastParams.growthAssumptions[measure] || 0.05;
        
        return Array.from({ length: 12 }, (_, index) => ({
          period: `2024-${String(index + 1).padStart(2, '0')}`,
          measure,
          forecast: baseValue * Math.pow(1 + growth, index),
          confidence_high: baseValue * Math.pow(1 + growth + 0.1, index),
          confidence_low: baseValue * Math.pow(1 + growth - 0.1, index),
        }));
      }).flat();

      setForecastResults(mockResults);
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateGrowthAssumption = (measure: string, value: number) => {
    setForecastParams(prev => ({
      ...prev,
      growthAssumptions: {
        ...prev.growthAssumptions,
        [measure]: value / 100 // Convert percentage to decimal
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Forecasting</h1>
          <p className="text-muted-foreground">
            Advanced forecasting with selective filtering and multiple methodologies
          </p>
        </div>
        <Button onClick={generateForecast} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Calculator className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Forecast
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Forecast Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Period Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Period
                </Label>
                <Select
                  value={forecastParams.timePeriod}
                  onValueChange={(value) => setForecastParams(prev => ({ ...prev, timePeriod: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Forecast Method */}
              <div className="space-y-2">
                <Label>Forecast Method</Label>
                <Select
                  value={forecastParams.forecastMethod}
                  onValueChange={(value) => setForecastParams(prev => ({ ...prev, forecastMethod: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear Regression</SelectItem>
                    <SelectItem value="exponential">Exponential Smoothing</SelectItem>
                    <SelectItem value="seasonal">Seasonal Decomposition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence Interval */}
              <div className="space-y-2">
                <Label>Confidence Interval: {forecastParams.confidenceInterval}%</Label>
                <Slider
                  value={[forecastParams.confidenceInterval]}
                  onValueChange={(value) => setForecastParams(prev => ({ ...prev, confidenceInterval: value[0] }))}
                  min={80}
                  max={99}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Measure Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Measures to Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableMeasures.map(measure => (
                  <div key={measure} className="flex items-center space-x-2">
                    <Checkbox
                      id={measure}
                      checked={selectedMeasures.includes(measure)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMeasures(prev => [...prev, measure]);
                        } else {
                          setSelectedMeasures(prev => prev.filter(m => m !== measure));
                        }
                      }}
                    />
                    <label htmlFor={measure} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {measure.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Growth Assumptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Growth Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedMeasures.map(measure => (
                  <div key={measure} className="space-y-2">
                    <Label className="text-sm">{measure.replace('_', ' ')}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={((forecastParams.growthAssumptions[measure] || 0) * 100).toFixed(1)}
                        onChange={(e) => updateGrowthAssumption(measure, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">% growth</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Selective Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="markets" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="markets" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Markets
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="channels" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Channels
                  </TabsTrigger>
                  <TabsTrigger value="costcenters" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Cost Centers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="markets" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {dimensions.markets.map(market => (
                      <div key={market.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`market-${market.id}`}
                          checked={forecastParams.markets.includes(market.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForecastParams(prev => ({
                                ...prev,
                                markets: [...prev.markets, market.id]
                              }));
                            } else {
                              setForecastParams(prev => ({
                                ...prev,
                                markets: prev.markets.filter(id => id !== market.id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`market-${market.id}`} className="text-sm">
                          {market.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {dimensions.products.map(product => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={forecastParams.products.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForecastParams(prev => ({
                                ...prev,
                                products: [...prev.products, product.id]
                              }));
                            } else {
                              setForecastParams(prev => ({
                                ...prev,
                                products: prev.products.filter(id => id !== product.id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`product-${product.id}`} className="text-sm">
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="channels" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {dimensions.channels.map(channel => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${channel.id}`}
                          checked={forecastParams.channels.includes(channel.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForecastParams(prev => ({
                                ...prev,
                                channels: [...prev.channels, channel.id]
                              }));
                            } else {
                              setForecastParams(prev => ({
                                ...prev,
                                channels: prev.channels.filter(id => id !== channel.id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`channel-${channel.id}`} className="text-sm">
                          {channel.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="costcenters" className="space-y-3 mt-4">
                  <div className="grid grid-cols-1 gap-2">
                    {dimensions.costCenters.map(costCenter => (
                      <div key={costCenter.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`costcenter-${costCenter.id}`}
                          checked={forecastParams.costCenters.includes(costCenter.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForecastParams(prev => ({
                                ...prev,
                                costCenters: [...prev.costCenters, costCenter.id]
                              }));
                            } else {
                              setForecastParams(prev => ({
                                ...prev,
                                costCenters: prev.costCenters.filter(id => id !== costCenter.id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`costcenter-${costCenter.id}`} className="text-sm">
                          {costCenter.name}
                          {costCenter.department && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {costCenter.department}
                            </Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Forecast Results */}
          {forecastResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Forecast Results</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMeasures.map(measure => {
                  const measureData = forecastResults
                    .filter(r => r.measure === measure)
                    .map(r => ({
                      period: r.period,
                      actual: undefined,
                      budget: undefined,
                      forecast: r.forecast,
                      confidence_high: r.confidence_high,
                      confidence_low: r.confidence_low,
                    }));

                  return (
                    <div key={measure} className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">{measure.replace('_', ' ')}</h4>
                      <SimpleChart
                        title={`${measure} Forecast`}
                        data={measureData}
                        showForecast={true}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}