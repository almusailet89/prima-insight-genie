import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatInsuranceMetric, getFavorabilityColor, formatPercentage } from '@/lib/fmt';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  variance: number;
  percentVariance: number;
  trend: 'up' | 'down' | 'flat';
  metric: string;
  currency?: string;
  isLoading?: boolean;
}

export function KpiCard({ 
  title, 
  value, 
  variance,
  percentVariance,
  trend, 
  metric,
  currency = 'EUR',
  isLoading = false 
}: KpiCardProps) {
  const favorability = getFavorabilityColor(
    percentVariance, 
    ['gwp', 'nep'].includes(metric.toLowerCase())
  );

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getVarianceColor = () => {
    switch (favorability) {
      case 'success': return 'text-success';
      case 'danger': return 'text-danger';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
      <div className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </h3>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
              getVarianceColor(),
              favorability === 'success' && 'bg-success/10',
              favorability === 'danger' && 'bg-danger/10',
              favorability === 'neutral' && 'bg-muted/50'
            )}>
              {getTrendIcon()}
              <span>{formatPercentage(percentVariance, true)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-foreground">
              {formatInsuranceMetric(metric, value)}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span className={getVarianceColor()}>
                {formatInsuranceMetric(metric, variance, true)}
              </span>
              <span className="mx-1">vs budget</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}