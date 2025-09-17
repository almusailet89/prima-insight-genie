import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Filter } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { VarianceTable } from '@/components/dashboard/VarianceTable';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ExportButton } from '@/components/shared/ExportButton';
import { apiClient } from '@/lib/api';
import { getUploadedData } from '@/lib/storage';
import { calculateVariance, aggregateQ4Data } from '@/lib/fmt';
import { toast } from '@/hooks/use-toast';

interface KPIData {
  name: string;
  value: number;
  variance: number;
  percentVariance: number;
  trend: 'up' | 'down' | 'flat';
  metric: string;
}

interface VarianceRow {
  department: string;
  actual: number;
  budget: number;
  variance: number;
  percentVariance: number;
}

interface ChartDataPoint {
  period: string;
  actual: number;
  budget: number;
  forecast?: number;
}

interface Filters {
  entity: string;
  period: string;
  department: string;
  currency: string;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [varianceData, setVarianceData] = useState<VarianceRow[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    entity: 'all',
    period: '2024-Q4',
    department: 'all',
    currency: 'EUR'
  });
  const [currentNarrative, setCurrentNarrative] = useState('');
  const [contextData, setContextData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Try to get demo variance data first
      const demoResponse = await apiClient.getDemoVariance();
      let data: any[] = [];
      
      if (demoResponse.data) {
        data = demoResponse.data;
      } else {
        // Fallback to uploaded data
        const uploadedData = await getUploadedData();
        if (uploadedData && uploadedData.length > 0) {
          data = uploadedData;
        } else {
          // Generate mock data for demonstration
          data = generateMockData();
        }
      }

      setContextData(data);
      
      // Process KPIs
      const kpiData = calculateKPIs(data, filters);
      setKpis(kpiData);
      
      // Process variance data
      const variance = calculateVarianceByDepartment(data, filters);
      setVarianceData(variance);
      
      // Process chart data
      const trends = generateTrendData(data, filters);
      setChartData(trends);
      
    } catch (error: any) {
      console.error('Dashboard data error:', error);
      toast({
        title: 'Data Load Error',
        description: 'Using mock data for demonstration',
      });
      
      // Fallback to mock data
      const mockData = generateMockData();
      setContextData(mockData);
      setKpis(calculateKPIs(mockData, filters));
      setVarianceData(calculateVarianceByDepartment(mockData, filters));
      setChartData(generateTrendData(mockData, filters));
      
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    const departments = ['underwriting', 'claims', 'sales', 'ops', 'it', 'ga'];
    const periods = ['2024-09', '2024-10', '2024-11', '2024-12'];
    const metrics = ['gwp', 'nep', 'loss_ratio', 'expense_ratio', 'claims'];
    const data: any[] = [];

    departments.forEach(dept => {
      periods.forEach(period => {
        metrics.forEach(metric => {
          const baseValue = Math.random() * 1000000;
          data.push({
            period,
            entity: 'Italy',
            department: dept,
            metric,
            actual: baseValue,
            budget: baseValue * (0.9 + Math.random() * 0.2),
            scenario: 'ACTUAL',
            currency: 'EUR'
          });
        });
      });
    });

    return data;
  };

  const calculateKPIs = (data: any[], filters: Filters): KPIData[] => {
    const kpis: KPIData[] = [];
    const metrics = ['gwp', 'nep', 'loss_ratio', 'expense_ratio', 'combined_ratio'];

    metrics.forEach(metric => {
      const filtered = data.filter(item => 
        item.metric === metric &&
        (filters.entity === 'all' || item.entity === filters.entity) &&
        (filters.department === 'all' || item.department === filters.department)
      );

      if (filtered.length > 0) {
        const actual = filtered.reduce((sum, item) => sum + (item.actual || 0), 0);
        const budget = filtered.reduce((sum, item) => sum + (item.budget || 0), 0);
        const variance = calculateVariance(actual, budget);
        
        kpis.push({
          name: metric.toUpperCase().replace('_', ' '),
          value: actual,
          variance: variance.absolute,
          percentVariance: variance.percentage,
          trend: variance.percentage > 0 ? 'up' : variance.percentage < 0 ? 'down' : 'flat',
          metric
        });
      }
    });

    return kpis;
  };

  const calculateVarianceByDepartment = (data: any[], filters: Filters): VarianceRow[] => {
    const departments = [...new Set(data.map(item => item.department))];
    
    return departments.map(dept => {
      const deptData = data.filter(item => 
        item.department === dept &&
        (filters.entity === 'all' || item.entity === filters.entity)
      );

      const actual = deptData.reduce((sum, item) => sum + (item.actual || 0), 0);
      const budget = deptData.reduce((sum, item) => sum + (item.budget || 0), 0);
      const variance = calculateVariance(actual, budget);

      return {
        department: dept,
        actual,
        budget,
        variance: variance.absolute,
        percentVariance: variance.percentage
      };
    });
  };

  const generateTrendData = (data: any[], filters: Filters): ChartDataPoint[] => {
    const periods = [...new Set(data.map(item => item.period))].sort();
    
    return periods.map(period => {
      const periodData = data.filter(item => 
        item.period === period &&
        (filters.entity === 'all' || item.entity === filters.entity) &&
        (filters.department === 'all' || item.department === filters.department)
      );

      const actual = periodData.reduce((sum, item) => sum + (item.actual || 0), 0);
      const budget = periodData.reduce((sum, item) => sum + (item.budget || 0), 0);

      return {
        period,
        actual,
        budget
      };
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insurance FP&A Dashboard</h1>
          <p className="text-muted-foreground">Performance overview and analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButton
            period={filters.period}
            narrative={currentNarrative}
            kpiData={kpis}
            varianceData={varianceData}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Entity</label>
              <Select value={filters.entity} onValueChange={(value) => setFilters(prev => ({ ...prev, entity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="Italy">Italy</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Period</label>
              <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-Q4">Q4 2024</SelectItem>
                  <SelectItem value="2024-12">Dec 2024</SelectItem>
                  <SelectItem value="2024-11">Nov 2024</SelectItem>
                  <SelectItem value="2024-10">Oct 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Department</label>
              <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="underwriting">Underwriting</SelectItem>
                  <SelectItem value="claims">Claims</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="ops">Operations</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="ga">G&A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency</label>
              <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.name}
            title={kpi.name}
            value={kpi.value}
            variance={kpi.variance}
            percentVariance={kpi.percentVariance}
            trend={kpi.trend}
            metric={kpi.metric}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends Chart */}
        <div className="lg:col-span-2">
          <TrendChart
            data={chartData}
            title="Performance Trends"
            showQ4Highlight={filters.period.includes('Q4')}
            isLoading={isLoading}
          />
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-1">
          <ChatPanel
            contextData={contextData}
            currentFilters={filters}
          />
        </div>
      </div>

      {/* Variance Table */}
      <VarianceTable
        data={varianceData}
        title="Department Performance Analysis"
        isLoading={isLoading}
      />
    </div>
  );
}