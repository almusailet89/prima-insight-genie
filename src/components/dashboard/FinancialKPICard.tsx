import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialKPICardProps {
  title: string;
  value: number | string;
  delta?: number;
  deltaType?: 'percentage' | 'currency' | 'ratio';
  format?: 'currency' | 'percentage' | 'number' | 'ratio';
  subtitle?: string;
  isLoading?: boolean;
}

export function FinancialKPICard({ 
  title, 
  value, 
  delta, 
  deltaType = 'percentage',
  format = 'currency',
  subtitle,
  isLoading 
}: FinancialKPICardProps) {
  if (isLoading) {
    return (
      <Card className="kpi-card">
        <div className="kpi-card-header">
          <div className="skeleton-title"></div>
        </div>
        <CardContent className="p-0">
          <div className="skeleton h-8 w-3/4 mb-2"></div>
          <div className="skeleton h-4 w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'ratio':
        return val.toFixed(2);
      default:
        return val.toLocaleString();
    }
  };

  const formatDelta = (deltaVal: number): string => {
    const absVal = Math.abs(deltaVal);
    switch (deltaType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(absVal);
      case 'percentage':
        return `${absVal.toFixed(1)}%`;
      case 'ratio':
        return absVal.toFixed(2);
      default:
        return absVal.toLocaleString();
    }
  };

  const getDeltaStyle = (deltaVal: number) => {
    if (Math.abs(deltaVal) < 0.01) return 'neutral';
    
    // For insurance metrics, lower is generally better for ratios
    const isRatioMetric = title.includes('Ratio') || title.includes('Loss');
    
    if (isRatioMetric) {
      return deltaVal < 0 ? 'favorable' : 'unfavorable';
    } else {
      return deltaVal > 0 ? 'favorable' : 'unfavorable';
    }
  };

  const getDeltaIcon = (deltaVal: number) => {
    if (Math.abs(deltaVal) < 0.01) return <Minus className="w-3 h-3" />;
    return deltaVal > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  return (
    <Card className="kpi-card group hover:shadow-xl transition-all duration-300">
      <div className="kpi-card-header">
        <h3 className="text-sm font-semibold text-white opacity-90">{title}</h3>
        {delta !== undefined && (
          <div className={`kpi-delta ${getDeltaStyle(delta)} bg-white/20 px-2 py-1 rounded-lg`}>
            {getDeltaIcon(delta)}
            <span className="text-white font-medium">
              {delta > 0 && deltaType !== 'ratio' ? '+' : ''}{formatDelta(delta)}
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-6 pt-0">
        <div className="kpi-value">
          {formatValue(value)}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}