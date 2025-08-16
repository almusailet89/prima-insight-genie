import { FactLedger, VarianceData, KPIData } from '@/types';

export const formatCurrency = (value: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

export const calculateVariance = (actual: number, budget: number) => {
  const absVariance = actual - budget;
  const percentVariance = budget !== 0 ? absVariance / budget : 0;
  return { absVariance, percentVariance };
};

export const getVarianceColor = (variance: number, isRevenueType = true): string => {
  if (variance === 0) return 'text-muted-foreground';
  
  const isPositive = variance > 0;
  const isFavorable = isRevenueType ? isPositive : !isPositive;
  
  return isFavorable ? 'text-success' : 'text-destructive';
};

export const getVarianceIcon = (variance: number): '↑' | '↓' | '→' => {
  if (variance > 0) return '↑';
  if (variance < 0) return '↓';
  return '→';
};

export const aggregateFactData = (
  facts: FactLedger[],
  groupBy: 'period' | 'business_unit' | 'market' | 'product' | 'channel'
): Record<string, { actual: number; budget: number; forecast: number }> => {
  const grouped: Record<string, { actual: number; budget: number; forecast: number }> = {};

  facts.forEach(fact => {
    let key: string;
    switch (groupBy) {
      case 'period':
        key = fact.period_id;
        break;
      case 'business_unit':
        key = fact.business_unit_id;
        break;
      case 'market':
        key = fact.market_id;
        break;
      case 'product':
        key = fact.product_id || 'N/A';
        break;
      case 'channel':
        key = fact.channel_id || 'N/A';
        break;
      default:
        key = 'total';
    }

    if (!grouped[key]) {
      grouped[key] = { actual: 0, budget: 0, forecast: 0 };
    }

    grouped[key][fact.scenario.toLowerCase() as 'actual' | 'budget' | 'forecast'] += fact.value;
  });

  return grouped;
};

export const calculateKPIs = (facts: FactLedger[]): KPIData[] => {
  const kpis: Record<string, { actual: number; budget: number }> = {};

  facts.forEach(fact => {
    if (!kpis[fact.measure]) {
      kpis[fact.measure] = { actual: 0, budget: 0 };
    }
    
    if (fact.scenario === 'ACTUAL') {
      kpis[fact.measure].actual += fact.value;
    } else if (fact.scenario === 'BUDGET') {
      kpis[fact.measure].budget += fact.value;
    }
  });

  return Object.entries(kpis).map(([name, data]) => {
    const { absVariance, percentVariance } = calculateVariance(data.actual, data.budget);
    const trend = absVariance > 0 ? 'up' : absVariance < 0 ? 'down' : 'flat';
    
    return {
      name,
      actual: data.actual,
      budget: data.budget,
      variance: absVariance,
      percentVariance,
      trend
    };
  });
};

export const generateForecast = (
  historicalData: number[],
  method: 'movingAverage' | 'yoyGrowth' | 'cagr',
  periods = 12
): number[] => {
  if (historicalData.length === 0) return [];

  switch (method) {
    case 'movingAverage': {
      const avgPeriods = Math.min(3, historicalData.length);
      const average = historicalData.slice(-avgPeriods).reduce((a, b) => a + b, 0) / avgPeriods;
      return Array(periods).fill(average);
    }
    
    case 'yoyGrowth': {
      if (historicalData.length < 12) return Array(periods).fill(historicalData[historicalData.length - 1]);
      const currentYear = historicalData.slice(-12);
      const previousYear = historicalData.slice(-24, -12);
      const growthRates = currentYear.map((curr, i) => (curr - previousYear[i]) / previousYear[i]);
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      
      const forecast = [];
      let lastValue = historicalData[historicalData.length - 1];
      for (let i = 0; i < periods; i++) {
        lastValue = lastValue * (1 + avgGrowth);
        forecast.push(lastValue);
      }
      return forecast;
    }
    
    case 'cagr': {
      if (historicalData.length < 2) return Array(periods).fill(historicalData[historicalData.length - 1]);
      const firstValue = historicalData[0];
      const lastValue = historicalData[historicalData.length - 1];
      const cagr = Math.pow(lastValue / firstValue, 1 / (historicalData.length - 1)) - 1;
      
      const forecast = [];
      let currentValue = lastValue;
      for (let i = 0; i < periods; i++) {
        currentValue = currentValue * (1 + cagr);
        forecast.push(currentValue);
      }
      return forecast;
    }
    
    default:
      return Array(periods).fill(historicalData[historicalData.length - 1]);
  }
};

export const applyScenarioChanges = (
  baseValue: number,
  measure: string,
  changes: Record<string, number>
): number => {
  let adjustedValue = baseValue;

  switch (measure) {
    case 'Revenue':
      adjustedValue *= (1 + (changes.priceChange || 0) / 100);
      adjustedValue *= (1 + (changes.volumeChange || 0) / 100);
      break;
    case 'Conversion':
      adjustedValue *= (1 + (changes.conversionChange || 0) / 100);
      break;
    case 'Retention':
      adjustedValue *= (1 + (changes.retentionChange || 0) / 100);
      break;
    case 'Opex':
      adjustedValue *= (1 + (changes.opexChange || 0) / 100);
      break;
    case 'LR':
      adjustedValue *= (1 + (changes.lossRatioChange || 0) / 100);
      break;
  }

  return adjustedValue;
};