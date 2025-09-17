// Formatting utilities for financial data

export const formatCurrency = (
  value: number, 
  currency = 'EUR', 
  showSign = false
): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(Math.abs(value));
  
  if (!showSign) return formatted;
  
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const formatNumber = (value: number, showSign = false): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(Math.abs(value));
  
  if (!showSign) return formatted;
  
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const formatPercentage = (value: number, showSign = false): string => {
  const formatted = `${Math.abs(value).toFixed(1)}%`;
  
  if (!showSign) return formatted;
  
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const formatRatio = (value: number): string => {
  return `${value.toFixed(2)}x`;
};

export const getFavorabilityColor = (
  variance: number, 
  isRevenueType = true
): 'success' | 'danger' | 'neutral' => {
  if (Math.abs(variance) < 0.01) return 'neutral';
  
  const isPositive = variance > 0;
  
  // For revenue metrics (GWP, NEP), positive variance is good
  // For cost metrics (Loss Ratio, Expense Ratio), negative variance is good
  if (isRevenueType) {
    return isPositive ? 'success' : 'danger';
  } else {
    return isPositive ? 'danger' : 'success';
  }
};

export const getVarianceIcon = (variance: number): '↑' | '↓' | '→' => {
  if (Math.abs(variance) < 0.01) return '→';
  return variance > 0 ? '↑' : '↓';
};

// Parse period strings (YYYY-MM or YYYY-Q1)
export const parsePeriod = (period: string): { year: number; month?: number; quarter?: number } => {
  if (period.includes('-Q')) {
    const [year, quarter] = period.split('-Q');
    return { year: parseInt(year), quarter: parseInt(quarter) };
  }
  
  const [year, month] = period.split('-');
  return { year: parseInt(year), month: parseInt(month) };
};

// Get Q4 periods for a given year
export const getQ4Periods = (year: number): string[] => {
  return [`${year}-10`, `${year}-11`, `${year}-12`];
};

// Aggregate data for Q4
export interface AggregatedData {
  actual: number;
  budget: number;
  forecast?: number;
}

export const aggregateQ4Data = (
  data: any[], 
  year: number,
  valueField = 'value'
): AggregatedData => {
  const q4Periods = getQ4Periods(year);
  
  const filtered = data.filter(item => 
    q4Periods.includes(item.period)
  );

  return {
    actual: filtered
      .filter(item => item.scenario === 'ACTUAL')
      .reduce((sum, item) => sum + (item[valueField] || 0), 0),
    budget: filtered
      .filter(item => item.scenario === 'BUDGET')
      .reduce((sum, item) => sum + (item[valueField] || 0), 0),
    forecast: filtered
      .filter(item => item.scenario === 'FORECAST')
      .reduce((sum, item) => sum + (item[valueField] || 0), 0),
  };
};

// Calculate variance
export const calculateVariance = (actual: number, budget: number) => {
  const absolute = actual - budget;
  const percentage = budget !== 0 ? (absolute / budget) * 100 : 0;
  
  return { absolute, percentage };
};

// Format insurance metrics
export const formatInsuranceMetric = (
  metric: string, 
  value: number, 
  showSign = false
): string => {
  switch (metric.toLowerCase()) {
    case 'gwp':
    case 'nep':
    case 'claims':
      return formatCurrency(value, 'EUR', showSign);
    
    case 'loss_ratio':
    case 'expense_ratio':
    case 'combined_ratio':
      return formatPercentage(value, showSign);
    
    case 'claims_frequency':
      return `${value.toFixed(2)} per 1000`;
    
    case 'claims_severity':
      return formatCurrency(value, 'EUR', showSign);
    
    default:
      return formatNumber(value, showSign);
  }
};

// Department mapping
export const getDepartmentDisplayName = (dept: string): string => {
  const mapping: Record<string, string> = {
    'underwriting': 'Underwriting',
    'claims': 'Claims',
    'sales': 'Sales',
    'ops': 'Operations', 
    'it': 'IT',
    'ga': 'G&A',
    'general_admin': 'G&A'
  };
  
  return mapping[dept.toLowerCase()] || dept;
};