import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { Calculator, TrendingUp, Calendar, Target } from 'lucide-react';

type ForecastMethod = 'movingAverage' | 'yoyGrowth' | 'cagr';

export default function Forecasting() {
  const [selectedMethod, setSelectedMethod] = useState<ForecastMethod>('movingAverage');
  const [forecastPeriods, setForecastPeriods] = useState('6');

  // Mock historical data
  const historicalData = [
    { period: 'Sep 23', actual: 3800, budget: 3700 },
    { period: 'Oct 23', actual: 3900, budget: 3800 },
    { period: 'Nov 23', actual: 4100, budget: 4000 },
    { period: 'Dec 23', actual: 4300, budget: 4200 },
    { period: 'Jan 24', actual: 4200, budget: 4000 },
    { period: 'Feb 24', actual: 4500, budget: 4200 },
    { period: 'Mar 24', actual: 4800, budget: 4500 },
    { period: 'Apr 24', actual: 4600, budget: 4700 },
    { period: 'May 24', actual: 5100, budget: 4900 },
  ];

  // Mock forecast data
  const forecastData = [
    ...historicalData,
    { period: 'Jun 24', actual: 0, budget: 0, forecast: 5200 },
    { period: 'Jul 24', actual: 0, budget: 0, forecast: 5350 },
    { period: 'Aug 24', actual: 0, budget: 0, forecast: 5500 },
    { period: 'Sep 24', actual: 0, budget: 0, forecast: 5650 },
    { period: 'Oct 24', actual: 0, budget: 0, forecast: 5800 },
    { period: 'Nov 24', actual: 0, budget: 0, forecast: 5950 },
  ];

  const generateForecast = () => {
    // Mock forecast generation logic
    console.log(`Generating forecast using ${selectedMethod} for ${forecastPeriods} periods`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Forecasting</h1>
        <p className="text-muted-foreground">
          Generate forecasts using various statistical methods and scenarios
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Quarter</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€16.5M</div>
            <p className="text-xs text-muted-foreground">
              Forecasted revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.2%</div>
            <p className="text-xs text-muted-foreground">
              Expected QoQ growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Model accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horizon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Mo</div>
            <p className="text-xs text-muted-foreground">
              Forecast period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
            <SimpleChart 
              data={forecastData}
              title="Historical & Forecasted Revenue"
              showForecast={true}
            />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Method</label>
              <Select value={selectedMethod} onValueChange={(value: ForecastMethod) => setSelectedMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movingAverage">Moving Average</SelectItem>
                  <SelectItem value="yoyGrowth">YoY Growth</SelectItem>
                  <SelectItem value="cagr">CAGR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Periods</label>
              <Select value={forecastPeriods} onValueChange={setForecastPeriods}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateForecast} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Generate Forecast
            </Button>

            <div className="pt-4 space-y-2">
              <h4 className="font-medium">Method Info</h4>
              <p className="text-sm text-muted-foreground">
                {selectedMethod === 'movingAverage' && 'Uses average of recent periods to predict future values'}
                {selectedMethod === 'yoyGrowth' && 'Projects growth based on year-over-year trends'}
                {selectedMethod === 'cagr' && 'Uses compound annual growth rate for projections'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}