import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage, getVarianceColor, getVarianceIcon } from '@/lib/finance-utils';
import { KPIData } from '@/types';

interface KPICardProps {
  data: KPIData;
  showBudget?: boolean;
}

export function KPICard({ data, showBudget = true }: KPICardProps) {
  const varianceColor = getVarianceColor(data.percentVariance, data.name === 'Revenue');
  const varianceIcon = getVarianceIcon(data.variance);
  const isMonetary = ['Revenue', 'COGS', 'GM', 'Opex', 'EBITDA', 'GWP'].includes(data.name);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
        <div className={`text-xs font-semibold ${varianceColor}`}>
          {varianceIcon} {formatPercentage(Math.abs(data.percentVariance))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isMonetary ? formatCurrency(data.actual) : formatPercentage(data.actual)}
        </div>
        {showBudget && (
          <div className="text-xs text-muted-foreground mt-1">
            vs Budget: {isMonetary ? formatCurrency(data.budget) : formatPercentage(data.budget)}
          </div>
        )}
        <div className={`text-xs mt-1 ${varianceColor}`}>
          {data.variance > 0 ? '+' : ''}{isMonetary ? formatCurrency(data.variance) : formatPercentage(data.variance)} variance
        </div>
      </CardContent>
    </Card>
  );
}