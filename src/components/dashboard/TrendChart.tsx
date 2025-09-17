import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/fmt';

interface ChartDataPoint {
  period: string;
  actual: number;
  budget: number;
  forecast?: number;
}

interface TrendChartProps {
  data: ChartDataPoint[];
  title?: string;
  type?: 'line' | 'area';
  showQ4Highlight?: boolean;
  isLoading?: boolean;
}

export function TrendChart({ 
  data, 
  title = 'Performance Trends',
  type = 'area',
  showQ4Highlight = false,
  isLoading = false 
}: TrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>(type);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.dataKey}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {chartType === 'line' ? 'Area' : 'Line'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatCurrency(value).replace('€', '')}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#actualGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="budget"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#budgetGradient)"
                  />
                  {data.some(d => d.forecast) && (
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      fillOpacity={1}
                      fill="url(#forecastGradient)"
                    />
                  )}
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    strokeDasharray="8 8"
                    dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                  />
                  {data.some(d => d.forecast) && (
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 3 }}
                    />
                  )}
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}