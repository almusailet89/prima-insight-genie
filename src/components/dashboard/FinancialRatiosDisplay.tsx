import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calculator, DollarSign, Percent, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FinancialRatio {
  id: string;
  name: string;
  formula: string;
  description: string;
  category: 'profitability' | 'efficiency' | 'liquidity' | 'leverage' | 'growth' | 'custom';
  displayFormat: 'percentage' | 'ratio' | 'currency' | 'number';
  isActive: boolean;
}

interface RatioValue {
  ratio: FinancialRatio;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
}

interface FinancialRatiosDisplayProps {
  selectedPeriod: string;
  viewMode: 'monthly' | 'quarterly';
}

export function FinancialRatiosDisplay({ selectedPeriod, viewMode }: FinancialRatiosDisplayProps) {
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [ratioValues, setRatioValues] = useState<RatioValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatios();
  }, []);

  useEffect(() => {
    if (ratios.length > 0) {
      calculateRatioValues();
    }
  }, [ratios, selectedPeriod, viewMode]);

  const loadRatios = () => {
    // Load ratios from localStorage (same as FinancialRatiosManager)
    const saved = localStorage.getItem('financial_ratios');
    if (saved) {
      const allRatios = JSON.parse(saved);
      setRatios(allRatios.filter((r: FinancialRatio) => r.isActive));
    }
    setLoading(false);
  };

  const calculateRatioValues = async () => {
    if (!ratios.length) return;

    // Mock calculation - in real implementation, this would fetch actual data and calculate ratios
    const mockValues: RatioValue[] = ratios.slice(0, 12).map((ratio, index) => {
      const baseValue = Math.random() * 100;
      const previousValue = baseValue + (Math.random() - 0.5) * 20;
      const change = baseValue - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

      return {
        ratio,
        currentValue: baseValue,
        previousValue,
        change,
        changePercent
      };
    });

    setRatioValues(mockValues);
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'ratio':
        return `${value.toFixed(2)}:1`;
      default:
        return value.toFixed(2);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profitability': return <DollarSign className="h-4 w-4" />;
      case 'efficiency': return <Activity className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'leverage': return <Percent className="h-4 w-4" />;
      case 'liquidity': return <Activity className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profitability': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'efficiency': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'growth': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'leverage': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'liquidity': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const groupedRatios = ratioValues.reduce((acc, ratioValue) => {
    const category = ratioValue.ratio.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ratioValue);
    return acc;
  }, {} as Record<string, RatioValue[]>);

  if (loading || ratioValues.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {loading ? 'Loading financial ratios...' : 'No active financial ratios configured'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Financial Ratios & KPIs
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{selectedPeriod}</Badge>
          <Badge variant="outline" className="capitalize">{viewMode}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="profitability">Profit</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="leverage">Leverage</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ratioValues.map((ratioValue) => (
                <RatioCard key={ratioValue.ratio.id} ratioValue={ratioValue} />
              ))}
            </div>
          </TabsContent>

          {Object.entries(groupedRatios).map(([category, values]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {values.map((ratioValue) => (
                  <RatioCard key={ratioValue.ratio.id} ratioValue={ratioValue} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RatioCard({ ratioValue }: { ratioValue: RatioValue }) {
  const { ratio, currentValue, changePercent } = ratioValue;
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'ratio':
        return `${value.toFixed(2)}:1`;
      default:
        return value.toFixed(2);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profitability': return <DollarSign className="h-4 w-4" />;
      case 'efficiency': return <Activity className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'leverage': return <Percent className="h-4 w-4" />;
      case 'liquidity': return <Activity className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profitability': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'efficiency': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'growth': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'leverage': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'liquidity': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight">{ratio.name}</h4>
              <Badge variant="secondary" className={`text-xs mt-1 ${getCategoryColor(ratio.category)}`}>
                {getCategoryIcon(ratio.category)}
                <span className="ml-1 capitalize">{ratio.category}</span>
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {formatValue(currentValue, ratio.displayFormat)}
              </div>
              <div className={`flex items-center text-xs ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
                {changePercent !== 0 && `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {ratio.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}