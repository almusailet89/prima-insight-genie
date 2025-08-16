import { useState, useEffect } from 'react';
import { GlobalFilters } from '@/components/filters/GlobalFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FilterState, VarianceData } from '@/types';
import { formatCurrency, formatPercentage, getVarianceColor, calculateVariance } from '@/lib/finance-utils';
import { Loader2, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';

export default function VarianceAnalysis() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: ['2024-01', '2024-12'],
    businessUnits: [],
    markets: [],
    products: [],
    channels: [],
  });

  const [baseScenario, setBaseScenario] = useState<'ACTUAL'>('ACTUAL');
  const [comparisonScenario, setComparisonScenario] = useState<'BUDGET' | 'FORECAST'>('BUDGET');
  const [varianceData, setVarianceData] = useState<VarianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  useEffect(() => {
    loadVarianceData();
  }, [filters, baseScenario, comparisonScenario]);

  const loadVarianceData = async () => {
    setLoading(true);
    try {
      // Fetch fact data with joins
      let query = supabase
        .from('fact_ledger')
        .select(`
          *,
          business_units:business_unit_id(name),
          dim_markets:market_id(country),
          dim_products:product_id(name),
          dim_channels:channel_id(name),
          dim_accounts:account_id(name, type)
        `)
        .in('scenario', [baseScenario, comparisonScenario]);

      // Apply filters
      if (filters.businessUnits.length > 0) {
        query = query.in('business_unit_id', filters.businessUnits);
      }

      const { data: factData, error } = await query;
      if (error) throw error;

      // Group and calculate variances by business unit
      const groupedData: Record<string, { base: number; comparison: number; entity: string; type: string }> = {};

      (factData as any || []).forEach((fact: any) => {
        const key = `${fact.business_unit_id}-${fact.measure}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            base: 0,
            comparison: 0,
            entity: fact.business_units?.name || 'Unknown',
            type: fact.measure,
          };
        }

        if (fact.scenario === baseScenario) {
          groupedData[key].base += fact.value;
        } else if (fact.scenario === comparisonScenario) {
          groupedData[key].comparison += fact.value;
        }
      });

      // Convert to variance data
      const variances: VarianceData[] = Object.entries(groupedData).map(([key, data]) => {
        const { absVariance, percentVariance } = calculateVariance(data.base, data.comparison);
        
        return {
          entity: `${data.entity} - ${data.type}`,
          actual: data.base,
          budget: data.comparison,
          forecast: 0, // Will be populated if comparing with forecast
          absVariance,
          percentVariance,
          type: data.type,
        };
      });

      // Sort by absolute variance (largest first)
      variances.sort((a, b) => Math.abs(b.absVariance) - Math.abs(a.absVariance));
      
      setVarianceData(variances);
    } catch (error) {
      console.error('Error loading variance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const explainVariance = async (variance: VarianceData) => {
    try {
      const response = await fetch('/api/explain-variance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variance,
          filters,
          context: {
            baseScenario,
            comparisonScenario,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get explanation');

      const data = await response.json();
      
      // Here you could show the explanation in a dialog or toast
      console.log('Variance explanation:', data.explanation);
    } catch (error) {
      console.error('Error explaining variance:', error);
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
          <h1 className="text-3xl font-bold tracking-tight">Variance Analysis</h1>
          <p className="text-muted-foreground">
            Compare actual performance against budget and forecasts
          </p>
        </div>
      </div>

      <GlobalFilters filters={filters} onFiltersChange={setFilters} />

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Base:</span>
              <Select value={baseScenario} onValueChange={(value: 'ACTUAL') => setBaseScenario(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTUAL">Actual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">vs</span>
              <Select 
                value={comparisonScenario} 
                onValueChange={(value: 'BUDGET' | 'FORECAST') => setComparisonScenario(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUDGET">Budget</SelectItem>
                  <SelectItem value="FORECAST">Forecast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">{comparisonScenario}</TableHead>
                <TableHead className="text-right">Abs Variance</TableHead>
                <TableHead className="text-right">% Variance</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {varianceData.map((row, index) => (
                <TableRow 
                  key={index}
                  className={selectedRow === `${index}` ? 'bg-muted' : ''}
                >
                  <TableCell className="font-medium">{row.entity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.actual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.budget)}</TableCell>
                  <TableCell className={`text-right ${getVarianceColor(row.absVariance, row.type === 'Revenue')}`}>
                    {row.absVariance > 0 ? '+' : ''}{formatCurrency(row.absVariance)}
                  </TableCell>
                  <TableCell className={`text-right ${getVarianceColor(row.percentVariance, row.type === 'Revenue')}`}>
                    {row.percentVariance > 0 ? '+' : ''}{formatPercentage(row.percentVariance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={Math.abs(row.percentVariance) > 0.1 ? 'destructive' : 'secondary'}
                    >
                      {Math.abs(row.percentVariance) > 0.1 ? 'Significant' : 'Minor'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRow(`${index}`);
                        explainVariance(row);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Favorable Variances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {varianceData.filter(v => v.absVariance > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items performing above {comparisonScenario.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Unfavorable Variances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {varianceData.filter(v => v.absVariance < 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items performing below {comparisonScenario.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(varianceData.reduce((sum, v) => sum + v.absVariance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Net variance impact
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}