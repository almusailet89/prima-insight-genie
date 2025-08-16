import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { EnhancedFilters } from '@/components/filters/EnhancedFilters';
import { ChartData } from '@/types';
import { TrendingUp, Calculator, BarChart3, Target, Calendar } from 'lucide-react';

interface ScenarioResult {
  scenario: string;
  assumptions: Record<string, number>;
  results: Array<{
    period: string;
    revenue: number;
    gwp: number;
    claims: number;
  }>;
}

interface EnhancedFilterState {
  dateRange: [string, string];
  timePeriod: 'weekly' | 'monthly' | 'quarterly';
  scenario: 'ACTUAL' | 'BUDGET' | 'FORECAST' | 'ALL';
  markets: string[];
  products: string[];
  channels: string[];
  costCenters: string[];
  departments: string[];
}

export default function ScenarioSimulator() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [filters, setFilters] = useState<EnhancedFilterState>({
    dateRange: ['2024-01', '2024-12'],
    timePeriod: 'monthly',
    scenario: 'ACTUAL',
    markets: [],
    products: [],
    channels: [],
    costCenters: [],
    departments: [],
  });
  
  const [assumptions, setAssumptions] = useState({
    revenueGrowth: 5,
    gwpGrowth: 8,
    claimsGrowth: 3,
    expenseGrowth: 4,
    inflationRate: 2.5,
    marketShare: 15,
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadScenarioData();
  }, [filters]);

  const loadScenarioData = async () => {
    try {
      let query = supabase
        .from('fact_ledger')
        .select(`
          *,
          calendar:period_id(period_key),
          dim_cost_centers:cost_center_id(code, name, department)
        `);

      // Apply scenario filter
      if (filters.scenario !== 'ALL') {
        query = query.eq('scenario', filters.scenario);
      }

      // Apply dimension filters
      if (filters.markets.length > 0) {
        query = query.in('market_id', filters.markets);
      }
      if (filters.products.length > 0) {
        query = query.in('product_id', filters.products);
      }
      if (filters.channels.length > 0) {
        query = query.in('channel_id', filters.channels);
      }
      if (filters.costCenters.length > 0) {
        query = query.in('cost_center_id', filters.costCenters);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process data for charts
      const processedData = (data || []).reduce((acc: Record<string, any>, row: any) => {
        const period = row.calendar?.period_key;
        if (!acc[period]) acc[period] = { period, actual: 0, budget: 0, forecast: 0 };
        
        switch (row.scenario) {
          case 'ACTUAL':
            acc[period].actual += row.value || 0;
            break;
          case 'BUDGET':
            acc[period].budget += row.value || 0;
            break;
          case 'FORECAST':
            acc[period].forecast += row.value || 0;
            break;
        }
        return acc;
      }, {});

      setChartData(Object.values(processedData) as ChartData[]);
    } catch (error) {
      console.error('Error loading scenario data:', error);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      // Enhanced simulation with multiple scenarios
      const scenarioResults: ScenarioResult[] = [
        {
          scenario: 'Base Case',
          assumptions: { ...assumptions },
          results: generateScenarioData(assumptions, 1)
        },
        {
          scenario: 'Optimistic',
          assumptions: { 
            ...assumptions, 
            revenueGrowth: assumptions.revenueGrowth * 1.5,
            gwpGrowth: assumptions.gwpGrowth * 1.3,
            claimsGrowth: assumptions.claimsGrowth * 0.8
          },
          results: generateScenarioData({
            ...assumptions, 
            revenueGrowth: assumptions.revenueGrowth * 1.5,
            gwpGrowth: assumptions.gwpGrowth * 1.3,
            claimsGrowth: assumptions.claimsGrowth * 0.8
          }, 1.2)
        },
        {
          scenario: 'Pessimistic',
          assumptions: { 
            ...assumptions, 
            revenueGrowth: assumptions.revenueGrowth * 0.5,
            gwpGrowth: assumptions.gwpGrowth * 0.7,
            claimsGrowth: assumptions.claimsGrowth * 1.3
          },
          results: generateScenarioData({
            ...assumptions, 
            revenueGrowth: assumptions.revenueGrowth * 0.5,
            gwpGrowth: assumptions.gwpGrowth * 0.7,
            claimsGrowth: assumptions.claimsGrowth * 1.3
          }, 0.8)
        }
      ];

      setScenarios(scenarioResults);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const generateScenarioData = (scenarioAssumptions: any, multiplier: number) => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthlyGrowth = 1 + (scenarioAssumptions.revenueGrowth / 100 / 12);
      const baseRevenue = 5000000 * multiplier;
      const baseGWP = 8000000 * multiplier;
      const baseClaims = 4500000 * multiplier;

      return {
        period: `2024-${String(index + 1).padStart(2, '0')}`,
        revenue: baseRevenue * Math.pow(monthlyGrowth, index) + (Math.random() - 0.5) * 100000,
        gwp: baseGWP * Math.pow(1 + (scenarioAssumptions.gwpGrowth / 100 / 12), index) + (Math.random() - 0.5) * 150000,
        claims: baseClaims * Math.pow(1 + (scenarioAssumptions.claimsGrowth / 100 / 12), index) + (Math.random() - 0.5) * 80000,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Scenario Simulator</h1>
          <p className="text-muted-foreground">
            Advanced scenario modeling with comprehensive filtering and assumptions
          </p>
        </div>
        <Button onClick={runSimulation} disabled={isSimulating}>
          {isSimulating ? (
            <>
              <Calculator className="h-4 w-4 mr-2 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Run Simulation
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Filters */}
      <EnhancedFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        showScenarioFilter={true}
        showTimePeriodFilter={true}
      />

      {/* Current Data Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Current Data - {filters.scenario}
            <Badge variant="outline" className="capitalize">
              {filters.timePeriod}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <SimpleChart
              title={`${filters.scenario} Performance`}
              data={chartData}
              showForecast={filters.scenario === 'FORECAST'}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Select filters to view data
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assumptions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Key Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenueGrowth">Revenue Growth (%)</Label>
              <Input
                id="revenueGrowth"
                type="number"
                value={assumptions.revenueGrowth}
                onChange={(e) => setAssumptions(prev => ({ ...prev, revenueGrowth: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gwpGrowth">GWP Growth (%)</Label>
              <Input
                id="gwpGrowth"
                type="number"
                value={assumptions.gwpGrowth}
                onChange={(e) => setAssumptions(prev => ({ ...prev, gwpGrowth: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimsGrowth">Claims Growth (%)</Label>
              <Input
                id="claimsGrowth"
                type="number"
                value={assumptions.claimsGrowth}
                onChange={(e) => setAssumptions(prev => ({ ...prev, claimsGrowth: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
              <Input
                id="inflationRate"
                type="number"
                value={assumptions.inflationRate}
                onChange={(e) => setAssumptions(prev => ({ ...prev, inflationRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketShare">Market Share (%)</Label>
              <Input
                id="marketShare"
                type="number"
                value={assumptions.marketShare}
                onChange={(e) => setAssumptions(prev => ({ ...prev, marketShare: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Simulation Results */}
        <div className="lg:col-span-2">
          {scenarios.length > 0 ? (
            <div className="space-y-6">
              <Tabs defaultValue="base" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="base">Base Case</TabsTrigger>
                  <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
                  <TabsTrigger value="pessimistic">Pessimistic</TabsTrigger>
                </TabsList>

                {scenarios.map((scenario, index) => (
                  <TabsContent key={scenario.scenario} value={['base', 'optimistic', 'pessimistic'][index]} className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>{scenario.scenario} - Assumptions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(scenario.assumptions).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <Badge variant="outline">
                                  {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Key Metrics Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Total Revenue:</span>
                              <span className="font-medium">
                                €{(scenario.results.reduce((sum, r) => sum + r.revenue, 0) / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Total GWP:</span>
                              <span className="font-medium">
                                €{(scenario.results.reduce((sum, r) => sum + r.gwp, 0) / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Total Claims:</span>
                              <span className="font-medium">
                                €{(scenario.results.reduce((sum, r) => sum + r.claims, 0) / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>{scenario.scenario} - Monthly Projections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SimpleChart
                          title={`${scenario.scenario} Projection`}
                          data={scenario.results.map(r => ({
                            period: r.period,
                            actual: r.revenue,
                            budget: r.gwp,
                            forecast: r.claims
                          }))}
                          showForecast={true}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Run a simulation to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}