export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface DimAccount {
  id: string;
  code: string;
  name: string;
  type: 'Revenue' | 'COGS' | 'Opex' | 'EBITDA' | 'GWP' | 'LR' | 'Contracts' | 'Conversion' | 'Retention';
  created_at: string;
}

export interface DimProduct {
  id: string;
  name: string;
  created_at: string;
}

export interface DimChannel {
  id: string;
  name: string;
  created_at: string;
}

export interface DimMarket {
  id: string;
  country: string;
  created_at: string;
}

export interface Calendar {
  id: string;
  year: number;
  month: number;
  period_key: string;
  created_at: string;
}

export interface FactLedger {
  id: string;
  company_id: string;
  business_unit_id: string;
  account_id: string;
  product_id?: string;
  channel_id?: string;
  market_id: string;
  period_id: string;
  measure: 'Revenue' | 'COGS' | 'GM' | 'Opex' | 'EBITDA' | 'GWP' | 'LR' | 'Contracts' | 'Conversion' | 'Retention';
  value: number;
  scenario: 'ACTUAL' | 'BUDGET' | 'FORECAST';
  created_at: string;
  updated_at: string;
}

export interface ScenarioInput {
  id: string;
  name: string;
  params_json: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface ReportJob {
  id: string;
  title: string;
  params_json: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  created_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: 'Admin' | 'Analyst' | 'Viewer';
  first_name?: string;
  last_name?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  dateRange: [string, string];
  businessUnits: string[];
  markets: string[];
  products: string[];
  channels: string[];
}

export interface VarianceData {
  entity: string;
  actual: number;
  budget: number;
  forecast: number;
  absVariance: number;
  percentVariance: number;
  type: string;
}

export interface KPIData {
  name: string;
  actual: number;
  budget: number;
  variance: number;
  percentVariance: number;
  trend: 'up' | 'down' | 'flat';
}

export interface ChartData {
  period: string;
  actual: number;
  budget: number;
  forecast?: number;
}

export interface ScenarioParams {
  priceChange: number;
  conversionChange: number;
  retentionChange: number;
  volumeChange: number;
  opexChange: number;
  lossRatioChange: number;
}