import { useState, useEffect } from 'react';
import { GlobalFilters } from '@/components/filters/GlobalFilters';
import { KPICard } from '@/components/dashboard/KPICard';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { FinancialRatiosDisplay } from '@/components/dashboard/FinancialRatiosDisplay';
import { supabase } from '@/integrations/supabase/client';
import { FilterState, FactLedger, KPIData, ChartData } from '@/types';
import { calculateKPIs, aggregateFactData } from '@/lib/finance-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, BarChart3, TrendingUp } from 'lucide-react';

export default function OverviewDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: ['2024-01', '2024-12'],
    businessUnits: [],
    markets: [],
    products: [],
    channels: [],
  });

  const [kpis, setKPIs] = useState<KPIData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-12');
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [activeScenario, setActiveScenario] = useState<'ACTUAL' | 'BUDGET' | 'FORECAST'>('ACTUAL');
  const [chartDataByScenario, setChartDataByScenario] = useState<Record<string, ChartData[]>>({});

  useEffect(() => {
    loadDashboardData();
  }, [filters, activeScenario]);

  useEffect(() => {
    if (chartDataByScenario[activeScenario]) {
      setChartData(chartDataByScenario[activeScenario]);
    }
  }, [activeScenario, chartDataByScenario]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Build query with filters for all scenarios
      let query = supabase
        .from('fact_ledger')
        .select(`
          *,
          calendar:period_id(period_key),
          business_units:business_unit_id(name),
          dim_markets:market_id(country),
          dim_cost_centers:cost_center_id(code, name, department)
        `);

      // Apply filters
      if (filters.businessUnits.length > 0) {
        query = query.in('business_unit_id', filters.businessUnits);
      }
      if (filters.markets.length > 0) {
        query = query.in('market_id', filters.markets);
      }
      if (filters.products.length > 0) {
        query = query.in('product_id', filters.products);
      }
      if (filters.channels.length > 0) {
        query = query.in('channel_id', filters.channels);
      }

      const { data: factData, error } = await query;

      if (error) throw error;

      const allData = factData as any || [];
      
      // Calculate KPIs for current scenario
      const scenarioData = allData.filter((f: any) => f.scenario === activeScenario);
      const kpiData = calculateKPIs(scenarioData);
      setKPIs(kpiData);

      // Prepare chart data by scenario
      const periodsQuery = await supabase
        .from('calendar')
        .select('id, period_key')
        .order('period_key');

      const periods = periodsQuery.data || [];
      
      const chartsByScenario: Record<string, ChartData[]> = {};
      
      ['ACTUAL', 'BUDGET', 'FORECAST'].forEach(scenario => {
        const monthlyData: ChartData[] = periods.map(period => {
          const periodFacts = allData.filter((f: any) => 
            f.period_id === period.id && f.scenario === scenario
          );
          
          const revenue = periodFacts
            .filter((f: any) => f.measure === 'Revenue' || f.measure === 'GWP')
            .reduce((sum: number, f: any) => sum + (f.value || 0), 0);

          return {
            period: period.period_key,
            actual: scenario === 'ACTUAL' ? revenue : undefined,
            budget: scenario === 'BUDGET' ? revenue : undefined,
            forecast: scenario === 'FORECAST' ? revenue : undefined,
          };
        });
        
        chartsByScenario[scenario] = monthlyData;
      });

      setChartDataByScenario(chartsByScenario);
      setChartData(chartsByScenario[activeScenario] || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground">
            Key performance indicators and financial trends
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">Jan 2024</SelectItem>
                <SelectItem value="2024-02">Feb 2024</SelectItem>
                <SelectItem value="2024-03">Mar 2024</SelectItem>
                <SelectItem value="2024-04">Apr 2024</SelectItem>
                <SelectItem value="2024-05">May 2024</SelectItem>
                <SelectItem value="2024-06">Jun 2024</SelectItem>
                <SelectItem value="2024-07">Jul 2024</SelectItem>
                <SelectItem value="2024-08">Aug 2024</SelectItem>
                <SelectItem value="2024-09">Sep 2024</SelectItem>
                <SelectItem value="2024-10">Oct 2024</SelectItem>
                <SelectItem value="2024-11">Nov 2024</SelectItem>
                <SelectItem value="2024-12">Dec 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('quarterly')}
            >
              Quarterly
            </Button>
          </div>
        </div>
      </div>

      <GlobalFilters filters={filters} onFiltersChange={setFilters} />

      {/* Scenario Tabs */}
      <Tabs value={activeScenario} onValueChange={(value) => setActiveScenario(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ACTUAL" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Actuals
            <Badge variant="secondary" className="text-xs">
              Until Aug
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="BUDGET" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Budget
            <Badge variant="secondary" className="text-xs">
              Full Year
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="FORECAST" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast
            <Badge variant="secondary" className="text-xs">
              Sep-Dec
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Content for each scenario */}
        {['ACTUAL', 'BUDGET', 'FORECAST'].map((scenario) => (
          <TabsContent key={scenario} value={scenario} className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.slice(0, 8).map((kpi) => (
                <KPICard key={kpi.name} data={kpi} />
              ))}
            </div>

            {/* Charts and Report Generator */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <SimpleChart
                  title={`${scenario} - Revenue Trends`}
                  data={chartData}
                  showForecast={scenario === 'FORECAST'}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Variance Summary - {scenario}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {kpis.slice(0, 5).map((kpi) => (
                        <div key={kpi.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{kpi.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {(kpi.percentVariance * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {kpi.variance > 0 ? 'Favorable' : 'Unfavorable'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <ReportGenerator />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Financial Ratios & KPIs Display */}
      <FinancialRatiosDisplay selectedPeriod={selectedPeriod} viewMode={viewMode} />

      {/* Additional insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Italy</span>
                <span className="font-medium text-success">+9.1%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Spain</span>
                <span className="font-medium text-success">+9.1%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>UK</span>
                <span className="font-medium text-destructive">-5.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Direct</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Partner</span>
                <span className="font-medium">35%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Digital</span>
                <span className="font-medium">20%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium text-success">15.0%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Retention Rate</span>
                <span className="font-medium text-destructive">85.0%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Loss Ratio</span>
                <span className="font-medium">0.62</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}