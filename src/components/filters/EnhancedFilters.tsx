import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Filter, 
  MapPin, 
  Package, 
  Users, 
  Building2, 
  Calendar,
  RefreshCw 
} from 'lucide-react';

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

interface EnhancedFiltersProps {
  filters: EnhancedFilterState;
  onFiltersChange: (filters: EnhancedFilterState) => void;
  showScenarioFilter?: boolean;
  showTimePeriodFilter?: boolean;
}

export function EnhancedFilters({ 
  filters, 
  onFiltersChange, 
  showScenarioFilter = true,
  showTimePeriodFilter = true 
}: EnhancedFiltersProps) {
  const [dimensions, setDimensions] = useState({
    markets: [] as Array<{ id: string; name: string }>,
    products: [] as Array<{ id: string; name: string }>,
    channels: [] as Array<{ id: string; name: string }>,
    costCenters: [] as Array<{ id: string; name: string; department: string }>,
  });

  const [loading, setLoading] = useState(true);

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
          department: cc.department
        })),
      });
    } catch (error) {
      console.error('Error loading dimensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: ['2024-01', '2024-12'],
      timePeriod: 'monthly',
      scenario: 'ACTUAL',
      markets: [],
      products: [],
      channels: [],
      costCenters: [],
      departments: [],
    });
  };

  const uniqueDepartments = [...new Set(dimensions.costCenters.map(cc => cc.department))];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.markets.length > 0) count++;
    if (filters.products.length > 0) count++;
    if (filters.channels.length > 0) count++;
    if (filters.costCenters.length > 0) count++;
    if (filters.departments.length > 0) count++;
    if (filters.scenario !== 'ACTUAL') count++;
    if (filters.timePeriod !== 'monthly') count++;
    return count;
  };

  if (loading) {
    return <div className="text-center p-4 text-muted-foreground">Loading filters...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Enhanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Time Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Period</label>
                <Select
                  value={filters.dateRange[0]}
                  onValueChange={(value) => onFiltersChange({
                    ...filters,
                    dateRange: [value, filters.dateRange[1]]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, '0');
                      return (
                        <SelectItem key={month} value={`2024-${month}`}>
                          2024-{month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Period</label>
                <Select
                  value={filters.dateRange[1]}
                  onValueChange={(value) => onFiltersChange({
                    ...filters,
                    dateRange: [filters.dateRange[0], value]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, '0');
                      return (
                        <SelectItem key={month} value={`2024-${month}`}>
                          2024-{month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showTimePeriodFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Period
                </label>
                <div className="flex gap-1">
                  {['weekly', 'monthly', 'quarterly'].map(period => (
                    <Button
                      key={period}
                      variant={filters.timePeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ ...filters, timePeriod: period as any })}
                      className="capitalize"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {showScenarioFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Scenario</label>
                <Select
                  value={filters.scenario}
                  onValueChange={(value) => onFiltersChange({ ...filters, scenario: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Scenarios</SelectItem>
                    <SelectItem value="ACTUAL">Actual</SelectItem>
                    <SelectItem value="BUDGET">Budget</SelectItem>
                    <SelectItem value="FORECAST">Forecast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dimension Filters */}
          <div className="space-y-4">
            <Tabs defaultValue="markets" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="markets" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Markets
                </TabsTrigger>
                <TabsTrigger value="products" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="channels" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="costcenters" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Cost Centers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="markets" className="space-y-2 mt-4">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {dimensions.markets.map(market => (
                    <div key={market.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`market-${market.id}`}
                        checked={filters.markets.includes(market.id)}
                        onCheckedChange={(checked) => {
                          const newMarkets = checked
                            ? [...filters.markets, market.id]
                            : filters.markets.filter(id => id !== market.id);
                          onFiltersChange({ ...filters, markets: newMarkets });
                        }}
                      />
                      <label htmlFor={`market-${market.id}`} className="text-sm">
                        {market.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="products" className="space-y-2 mt-4">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {dimensions.products.map(product => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={filters.products.includes(product.id)}
                        onCheckedChange={(checked) => {
                          const newProducts = checked
                            ? [...filters.products, product.id]
                            : filters.products.filter(id => id !== product.id);
                          onFiltersChange({ ...filters, products: newProducts });
                        }}
                      />
                      <label htmlFor={`product-${product.id}`} className="text-sm">
                        {product.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="channels" className="space-y-2 mt-4">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {dimensions.channels.map(channel => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.id}`}
                        checked={filters.channels.includes(channel.id)}
                        onCheckedChange={(checked) => {
                          const newChannels = checked
                            ? [...filters.channels, channel.id]
                            : filters.channels.filter(id => id !== channel.id);
                          onFiltersChange({ ...filters, channels: newChannels });
                        }}
                      />
                      <label htmlFor={`channel-${channel.id}`} className="text-sm">
                        {channel.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="costcenters" className="space-y-2 mt-4">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {/* Departments Filter */}
                  <div className="pb-2 border-b">
                    <label className="text-xs font-medium text-muted-foreground">By Department:</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {uniqueDepartments.map(dept => (
                        <Badge
                          key={dept}
                          variant={filters.departments.includes(dept) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            const newDepts = filters.departments.includes(dept)
                              ? filters.departments.filter(d => d !== dept)
                              : [...filters.departments, dept];
                            onFiltersChange({ ...filters, departments: newDepts });
                          }}
                        >
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Individual Cost Centers */}
                  {dimensions.costCenters
                    .filter(cc => filters.departments.length === 0 || filters.departments.includes(cc.department))
                    .map(costCenter => (
                    <div key={costCenter.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`costcenter-${costCenter.id}`}
                        checked={filters.costCenters.includes(costCenter.id)}
                        onCheckedChange={(checked) => {
                          const newCostCenters = checked
                            ? [...filters.costCenters, costCenter.id]
                            : filters.costCenters.filter(id => id !== costCenter.id);
                          onFiltersChange({ ...filters, costCenters: newCostCenters });
                        }}
                      />
                      <label htmlFor={`costcenter-${costCenter.id}`} className="text-sm">
                        {costCenter.name}
                        <Badge variant="outline" className="ml-1 text-xs">
                          {costCenter.department}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Active Filters Summary */}
        {getActiveFilterCount() > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Active Filters:</span>
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {filters.scenario !== 'ACTUAL' && (
                <Badge variant="outline" className="text-xs">
                  Scenario: {filters.scenario}
                </Badge>
              )}
              {filters.timePeriod !== 'monthly' && (
                <Badge variant="outline" className="text-xs capitalize">
                  {filters.timePeriod}
                </Badge>
              )}
              {filters.markets.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Markets: {filters.markets.length}
                </Badge>
              )}
              {filters.products.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Products: {filters.products.length}
                </Badge>
              )}
              {filters.channels.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Channels: {filters.channels.length}
                </Badge>
              )}
              {filters.costCenters.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Cost Centers: {filters.costCenters.length}
                </Badge>
              )}
              {filters.departments.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Departments: {filters.departments.length}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}