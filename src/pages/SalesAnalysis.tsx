import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

export default function SalesAnalysis() {
  // Mock data for charts
  const salesTrendData = [
    { period: 'Jan', actual: 4200, budget: 4000 },
    { period: 'Feb', actual: 4500, budget: 4200 },
    { period: 'Mar', actual: 4800, budget: 4500 },
    { period: 'Apr', actual: 4600, budget: 4700 },
    { period: 'May', actual: 5100, budget: 4900 },
  ];

  const conversionData = [
    { period: 'Jan', actual: 12.5, budget: 12.0 },
    { period: 'Feb', actual: 13.2, budget: 12.5 },
    { period: 'Mar', actual: 12.8, budget: 13.0 },
    { period: 'Apr', actual: 14.1, budget: 13.5 },
    { period: 'May', actual: 13.9, budget: 14.0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analysis</h1>
        <p className="text-muted-foreground">
          Track sales performance, conversion rates, and customer metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€23.2M</div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13.9%</div>
            <p className="text-xs text-muted-foreground">
              -0.1% from target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,145</div>
            <p className="text-xs text-muted-foreground">
              +5.7% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart 
              data={salesTrendData}
              title="Monthly Sales Performance"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart 
              data={conversionData}
              title="Conversion Rate Performance"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}