import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinancialKPICard } from './FinancialKPICard';
import { FinancialChatPanel } from '../chat/FinancialChatPanel';
import { SimpleChart } from '../charts/SimpleChart';
import { Download, RefreshCw, Calendar, Filter, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ui/theme-provider';

interface KPIData {
  gwp: number;
  nep: number;
  lossRatio: number;
  expenseRatio: number;
  combinedRatio: number;
  gwpDelta: number;
  nepDelta: number;
  lossRatioDelta: number;
  expenseRatioDelta: number;
  combinedRatioDelta: number;
}

interface VarianceData {
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
  category: string;
}

export function ModernFinancialDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [varianceData, setVarianceData] = useState<VarianceData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2024');
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockKPIData: KPIData = {
        gwp: 125000000,
        nep: 98500000,
        lossRatio: 0.62,
        expenseRatio: 0.35,
        combinedRatio: 0.97,
        gwpDelta: 0.08,
        nepDelta: 0.12,
        lossRatioDelta: -0.05,
        expenseRatioDelta: 0.02,
        combinedRatioDelta: -0.03
      };

      const mockVarianceData: VarianceData[] = [
        { category: 'Premium Income', actual: 125000000, budget: 120000000, variance: 5000000, variancePercent: 4.2 },
        { category: 'Claims Incurred', actual: 77500000, budget: 78000000, variance: -500000, variancePercent: -0.6 },
        { category: 'Operating Expenses', actual: 43750000, budget: 42000000, variance: 1750000, variancePercent: 4.2 },
        { category: 'Underwriting Result', actual: 3750000, budget: 0, variance: 3750000, variancePercent: 100 }
      ];

      const mockChartData = [
        { month: 'Jan', actual: 95000000, budget: 92000000, forecast: 94000000 },
        { month: 'Feb', actual: 98000000, budget: 95000000, forecast: 97000000 },
        { month: 'Mar', actual: 102000000, budget: 98000000, forecast: 101000000 },
        { month: 'Apr', actual: 108000000, budget: 105000000, forecast: 107000000 },
        { month: 'May', actual: 112000000, budget: 108000000, forecast: 111000000 },
        { month: 'Jun', actual: 115000000, budget: 112000000, forecast: 114000000 },
        { month: 'Jul', actual: 118000000, budget: 115000000, forecast: 117000000 },
        { month: 'Aug', actual: 121000000, budget: 118000000, forecast: 120000000 },
        { month: 'Sep', actual: 123000000, budget: 120000000, forecast: 122000000 },
        { month: 'Oct', actual: 124500000, budget: 122000000, forecast: 123500000 },
        { month: 'Nov', actual: 124800000, budget: 123500000, forecast: 124000000 },
        { month: 'Dec', actual: 125000000, budget: 124000000, forecast: 124500000 }
      ];

      setKpiData(mockKPIData);
      setVarianceData(mockVarianceData);
      setChartData(mockChartData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPPT = async () => {
    try {
      setExportLoading(true);
      
      const response = await fetch('/api/export/ppt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: selectedPeriod,
          kpiData,
          varianceData,
          chartData
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prima_Financial_Report_${selectedPeriod.replace(' ', '_')}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-64"></div>
            <div className="skeleton h-4 w-48"></div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-10 w-32"></div>
            <div className="skeleton h-10 w-32"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-kpi"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-2xl"></div>
          <div className="skeleton h-96 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background to-secondary/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Prima Insight Genie
          </h1>
          <p className="text-muted-foreground mt-1">
            Financial Performance Dashboard • {selectedPeriod}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            className="btn-export"
            size="sm"
            onClick={handleExportPPT}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PPT
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <FinancialKPICard
            title="Gross Written Premium"
            value={kpiData.gwp}
            delta={kpiData.gwpDelta}
            deltaType="percentage"
            format="currency"
            subtitle="vs. Prior Period"
          />
          <FinancialKPICard
            title="Net Earned Premium"
            value={kpiData.nep}
            delta={kpiData.nepDelta}
            deltaType="percentage" 
            format="currency"
            subtitle="vs. Prior Period"
          />
          <FinancialKPICard
            title="Loss Ratio"
            value={kpiData.lossRatio}
            delta={kpiData.lossRatioDelta}
            deltaType="percentage"
            format="ratio"
            subtitle="Claims / NEP"
          />
          <FinancialKPICard
            title="Expense Ratio"
            value={kpiData.expenseRatio}
            delta={kpiData.expenseRatioDelta}
            deltaType="percentage"
            format="ratio"
            subtitle="Expenses / NEP"
          />
          <FinancialKPICard
            title="Combined Ratio"
            value={kpiData.combinedRatio}
            delta={kpiData.combinedRatioDelta}
            deltaType="percentage"
            format="ratio"
            subtitle="Loss + Expense Ratio"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-2xl">
            <CardTitle>Premium Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleChart 
              data={chartData}
              xDataKey="month"
              lines={[
                { dataKey: 'actual', stroke: 'hsl(var(--primary))', name: 'Actual' },
                { dataKey: 'budget', stroke: 'hsl(var(--muted-foreground))', name: 'Budget', strokeDasharray: '5 5' },
                { dataKey: 'forecast', stroke: 'hsl(var(--accent))', name: 'Forecast' }
              ]}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <FinancialChatPanel />
      </div>

      {/* Variance Analysis */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-2xl">
          <CardTitle>Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {varianceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-card/50 rounded-xl border">
                <div className="flex-1">
                  <h4 className="font-medium">{item.category}</h4>
                  <p className="text-sm text-muted-foreground">
                    Actual: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.actual)}
                    {' • '}
                    Budget: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.budget)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={item.variance > 0 ? 'default' : 'secondary'}>
                    {item.variance > 0 ? '+' : ''}
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.variance)}
                  </Badge>
                  <p className={`text-sm mt-1 font-medium ${
                    item.variancePercent > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}