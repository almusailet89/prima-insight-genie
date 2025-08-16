import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/types';
import { formatCurrency } from '@/lib/finance-utils';

interface SimpleChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'line';
  showForecast?: boolean;
}

export function SimpleChart({ title, data, type = 'bar', showForecast = false }: SimpleChartProps) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.actual, d.budget, d.forecast || 0))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{item.period}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-primary">Actual: {formatCurrency(item.actual)}</span>
                  <span className="text-muted-foreground">Budget: {formatCurrency(item.budget)}</span>
                  {showForecast && item.forecast && (
                    <span className="text-orange-500">Forecast: {formatCurrency(item.forecast)}</span>
                  )}
                </div>
              </div>
              
              <div className="relative h-8 bg-muted rounded">
                {/* Budget bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded"
                  style={{ width: `${(item.budget / maxValue) * 100}%` }}
                />
                {/* Actual bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded"
                  style={{ width: `${(item.actual / maxValue) * 100}%` }}
                />
                {/* Forecast bar */}
                {showForecast && item.forecast && (
                  <div
                    className="absolute top-0 left-0 h-full bg-orange-500/60 rounded"
                    style={{ width: `${(item.forecast / maxValue) * 100}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted-foreground/30 rounded-sm" />
            <span>Budget</span>
          </div>
          {showForecast && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500/60 rounded-sm" />
              <span>Forecast</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}