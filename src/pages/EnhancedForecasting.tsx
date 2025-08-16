import { useState, useEffect, useMemo } from 'react';
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
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

interface ForecastParams {
  measures: string[];
  countries: string[];
  departments: string[];
  costCenters: string[];
  products: string[];
  channels: string[];
  timePeriod: 'weekly' | 'monthly' | 'quarterly';
  forecastMethod: 'linear' | 'exponential' | 'seasonal';
  growthAssumptions: Record<string, number>;
  seasonalFactors: Record<string, number>;
  confidenceInterval: number;
  dateRange: {
    startYear: number;
    endYear: number;
    startMonth?: number;
    endMonth?: number;
    startWeek?: number;
    endWeek?: number;
  };
}

interface DimensionOption {
  id: string;
  name: string;
  department?: string;
  country?: string;
  code?: string;
}

interface HierarchicalData {
  countries: string[];
  departments: Record<string, string[]>;
  costCenters: Record<string, DimensionOption[]>;
}

export default function EnhancedForecasting() {
  const [forecastParams, setForecastParams] = useState<ForecastParams>({
    measures: ['Revenue', 'GWP', 'Claims'],
    countries: [],
    departments: [],
    costCenters: [],
    products: [],
    channels: [],
    timePeriod: 'monthly',
    forecastMethod: 'linear',
    growthAssumptions: {},
    seasonalFactors: {},
    confidenceInterval: 95,
    dateRange: {
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
    },
  });

  const [dimensions, setDimensions] = useState({
    markets: [] as DimensionOption[],
    products: [] as DimensionOption[],
    channels: [] as DimensionOption[],
    costCenters: [] as DimensionOption[],
  });

  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({
    countries: [],
    departments: {},
    costCenters: {},
  });

  const [forecastResults, setForecastResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>(['Revenue']);

  const availableMeasures = [
    'Revenue', 'GWP', 'Claims', 'Premium_Earned', 'Operating_Expenses',
    'COGS', 'Opex', 'EBITDA', 'Net_Income', 'Investment_Income'
  ];

  // Generate years from current year to 2030
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 2030 - currentYear + 1 }, (_, i) => currentYear + i);
  }, []);

  // Generate months
  const availableMonths = useMemo(() => [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ], []);

  // Generate weeks (1-53)
  const availableWeeks = useMemo(() => {
    return Array.from({ length: 53 }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));
  }, []);

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
        markets: (marketsRes.data || []).map((m: any) => ({ id: m.id, name: m.country, country: m.country })),
        products: (productsRes.data || []).map((p: any) => ({ id: p.id, name: p.name })),
        channels: (channelsRes.data || []).map((c: any) => ({ id: c.id, name: c.name })),
        costCenters: (costCentersRes.data || []).map((cc: any) => ({
          id: cc.id,
          name: `${cc.code} - ${cc.name}`,
          department: cc.department,
          code: cc.code
        })),
      });

      // Build hierarchical data structure
      const costCentersData = costCentersRes.data || [];
      const marketsData = marketsRes.data || [];
      
      const countries = [...new Set(marketsData.map((m: any) => m.country))];
      const departments: Record<string, string[]> = {};
      const costCentersByDept: Record<string, DimensionOption[]> = {};

      // Group departments by country (simplified - in real app, you'd have proper country-department mapping)
      countries.forEach(country => {
        const depts = [...new Set(costCentersData.map((cc: any) => cc.department))];
        departments[country] = depts;
      });

      // Group cost centers by department
      costCentersData.forEach((cc: any) => {
        if (!costCentersByDept[cc.department]) {
          costCentersByDept[cc.department] = [];
        }
        costCentersByDept[cc.department].push({
          id: cc.id,
          name: `${cc.code} - ${cc.name}`,
          department: cc.department,
          code: cc.code
        });
      });

      setHierarchicalData({
        countries,
        departments,
        costCenters: costCentersByDept,
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
          period: `${forecastParams.dateRange.startYear}-${String(index + 1).padStart(2, '0')}`,
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

  const handleSelectAllCountries = () => {
    const allSelected = hierarchicalData.countries.length === forecastParams.countries.length;
    if (allSelected) {
      setForecastParams(prev => ({ ...prev, countries: [], departments: [], costCenters: [] }));
    } else {
      const allDepartments = Object.values(hierarchicalData.departments).flat();
      const allCostCenters = Object.values(hierarchicalData.costCenters).flat().map(cc => cc.id);
      setForecastParams(prev => ({
        ...prev,
        countries: [...hierarchicalData.countries],
        departments: allDepartments,
        costCenters: allCostCenters,
      }));
    }
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    if (checked) {
      const countryDepartments = hierarchicalData.departments[country] || [];
      const countryCostCenters = countryDepartments.flatMap(dept => 
        hierarchicalData.costCenters[dept]?.map(cc => cc.id) || []
      );
      
      setForecastParams(prev => ({
        ...prev,
        countries: [...prev.countries, country],
        departments: [...prev.departments, ...countryDepartments],
        costCenters: [...prev.costCenters, ...countryCostCenters],
      }));
    } else {
      const countryDepartments = hierarchicalData.departments[country] || [];
      const countryCostCenters = countryDepartments.flatMap(dept => 
        hierarchicalData.costCenters[dept]?.map(cc => cc.id) || []
      );
      
      setForecastParams(prev => ({
        ...prev,
        countries: prev.countries.filter(c => c !== country),
        departments: prev.departments.filter(d => !countryDepartments.includes(d)),
        costCenters: prev.costCenters.filter(cc => !countryCostCenters.includes(cc)),
      }));
    }
  };

  const handleDepartmentChange = (department: string, checked: boolean) => {
    if (checked) {
      const deptCostCenters = hierarchicalData.costCenters[department]?.map(cc => cc.id) || [];
      setForecastParams(prev => ({
        ...prev,
        departments: [...prev.departments, department],
        costCenters: [...prev.costCenters, ...deptCostCenters],
      }));
    } else {
      const deptCostCenters = hierarchicalData.costCenters[department]?.map(cc => cc.id) || [];
      setForecastParams(prev => ({
        ...prev,
        departments: prev.departments.filter(d => d !== department),
        costCenters: prev.costCenters.filter(cc => !deptCostCenters.includes(cc)),
      }));
    }
  };

  const handleCostCenterChange = (costCenterId: string, checked: boolean) => {
    if (checked) {
      setForecastParams(prev => ({
        ...prev,
        costCenters: [...prev.costCenters, costCenterId]
      }));
    } else {
      setForecastParams(prev => ({
        ...prev,
        costCenters: prev.costCenters.filter(id => id !== costCenterId)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Forecasting</h1>
          <p className="text-muted-foreground">
            Advanced forecasting with hierarchical filtering and comprehensive date controls
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
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range & Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Years */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Start Year</Label>
                  <Select
                    value={forecastParams.dateRange.startYear.toString()}
                    onValueChange={(value) => setForecastParams(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startYear: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Year</Label>
                  <Select
                    value={forecastParams.dateRange.endYear.toString()}
                    onValueChange={(value) => setForecastParams(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endYear: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <Label>Time Period</Label>
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

              {/* Month/Week Selection */}
              {forecastParams.timePeriod === 'monthly' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Start Month</Label>
                    <Select
                      value={forecastParams.dateRange.startMonth?.toString() || ''}
                      onValueChange={(value) => setForecastParams(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, startMonth: value ? parseInt(value) : undefined }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Month</Label>
                    <Select
                      value={forecastParams.dateRange.endMonth?.toString() || ''}
                      onValueChange={(value) => setForecastParams(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, endMonth: value ? parseInt(value) : undefined }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {forecastParams.timePeriod === 'weekly' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Start Week</Label>
                    <Select
                      value={forecastParams.dateRange.startWeek?.toString() || ''}
                      onValueChange={(value) => setForecastParams(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, startWeek: value ? parseInt(value) : undefined }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select week" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map(week => (
                          <SelectItem key={week.value} value={week.value.toString()}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Week</Label>
                    <Select
                      value={forecastParams.dateRange.endWeek?.toString() || ''}
                      onValueChange={(value) => setForecastParams(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, endWeek: value ? parseInt(value) : undefined }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select week" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map(week => (
                          <SelectItem key={week.value} value={week.value.toString()}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Forecast Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

        {/* Hierarchical Filters Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Organizational Hierarchy Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hierarchy" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hierarchy" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Hierarchy
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="channels" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Channels
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hierarchy" className="space-y-4 mt-4">
                  {/* Select All Countries */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllCountries}
                        className="h-6 w-6 p-0"
                      >
                        {hierarchicalData.countries.length === forecastParams.countries.length ? 
                          <CheckSquare className="h-4 w-4" /> : 
                          <Square className="h-4 w-4" />
                        }
                      </Button>
                      <Label className="font-semibold">Select All Countries</Label>
                    </div>
                    <Badge variant="secondary">
                      {forecastParams.countries.length} / {hierarchicalData.countries.length}
                    </Badge>
                  </div>

                  {/* Countries */}
                  <div className="space-y-3">
                    {hierarchicalData.countries.map(country => (
                      <div key={country} className="border rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`country-${country}`}
                            checked={forecastParams.countries.includes(country)}
                            onCheckedChange={(checked) => handleCountryChange(country, checked as boolean)}
                          />
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <Label htmlFor={`country-${country}`} className="font-medium">
                            {country}
                          </Label>
                        </div>

                        {/* Departments for this country */}
                        {forecastParams.countries.includes(country) && (
                          <div className="ml-6 space-y-2">
                            {hierarchicalData.departments[country]?.map(department => (
                              <div key={department} className="border-l-2 border-gray-200 pl-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Checkbox
                                    id={`dept-${department}`}
                                    checked={forecastParams.departments.includes(department)}
                                    onCheckedChange={(checked) => handleDepartmentChange(department, checked as boolean)}
                                  />
                                  <Building2 className="h-4 w-4 text-green-500" />
                                  <Label htmlFor={`dept-${department}`} className="text-sm font-medium">
                                    {department}
                                  </Label>
                                </div>

                                {/* Cost Centers for this department */}
                                {forecastParams.departments.includes(department) && (
                                  <div className="ml-6 space-y-1">
                                    {hierarchicalData.costCenters[department]?.map(costCenter => (
                                      <div key={costCenter.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`cc-${costCenter.id}`}
                                          checked={forecastParams.costCenters.includes(costCenter.id)}
                                          onCheckedChange={(checked) => handleCostCenterChange(costCenter.id, checked as boolean)}
                                        />
                                        <Building2 className="h-3 w-3 text-orange-500" />
                                        <Label htmlFor={`cc-${costCenter.id}`} className="text-xs">
                                          {costCenter.name}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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