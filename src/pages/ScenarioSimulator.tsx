import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Calculator, BarChart } from 'lucide-react';

interface ScenarioParams {
  priceChange: number;
  conversionChange: number;
  retentionChange: number;
  volumeChange: number;
  opexChange: number;
  lossRatioChange: number;
}

export default function ScenarioSimulator() {
  const [params, setParams] = useState<ScenarioParams>({
    priceChange: 0,
    conversionChange: 0,
    retentionChange: 0,
    volumeChange: 0,
    opexChange: 0,
    lossRatioChange: 0,
  });

  const handleParamChange = (param: keyof ScenarioParams, value: number) => {
    setParams(prev => ({ ...prev, [param]: value }));
  };

  const resetScenario = () => {
    setParams({
      priceChange: 0,
      conversionChange: 0,
      retentionChange: 0,
      volumeChange: 0,
      opexChange: 0,
      lossRatioChange: 0,
    });
  };

  // Mock impact calculations
  const revenueImpact = (params.priceChange + params.conversionChange + params.volumeChange) * 1000000;
  const profitImpact = revenueImpact - (params.opexChange * 500000) - (params.lossRatioChange * 200000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scenario Simulator</h1>
        <p className="text-muted-foreground">
          Model different business scenarios and see their financial impact
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Scenario Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Price Change (%)</Label>
                  <Slider
                    value={[params.priceChange]}
                    onValueChange={([value]) => handleParamChange('priceChange', value)}
                    min={-50}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {params.priceChange > 0 ? '+' : ''}{params.priceChange}%
                  </p>
                </div>

                <div>
                  <Label>Conversion Rate Change (%)</Label>
                  <Slider
                    value={[params.conversionChange]}
                    onValueChange={([value]) => handleParamChange('conversionChange', value)}
                    min={-30}
                    max={30}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {params.conversionChange > 0 ? '+' : ''}{params.conversionChange}%
                  </p>
                </div>

                <div>
                  <Label>Volume Change (%)</Label>
                  <Slider
                    value={[params.volumeChange]}
                    onValueChange={([value]) => handleParamChange('volumeChange', value)}
                    min={-40}
                    max={40}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {params.volumeChange > 0 ? '+' : ''}{params.volumeChange}%
                  </p>
                </div>

                <Separator />

                <div>
                  <Label>Operating Expenses Change (%)</Label>
                  <Slider
                    value={[params.opexChange]}
                    onValueChange={([value]) => handleParamChange('opexChange', value)}
                    min={-25}
                    max={25}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {params.opexChange > 0 ? '+' : ''}{params.opexChange}%
                  </p>
                </div>

                <div>
                  <Label>Loss Ratio Change (%)</Label>
                  <Slider
                    value={[params.lossRatioChange]}
                    onValueChange={([value]) => handleParamChange('lossRatioChange', value)}
                    min={-20}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {params.lossRatioChange > 0 ? '+' : ''}{params.lossRatioChange}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetScenario} variant="outline">
                  Reset to Baseline
                </Button>
                <Button>
                  Save Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {revenueImpact > 0 ? '+' : ''}€{(revenueImpact / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                vs Current baseline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Profit Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitImpact > 0 ? '+' : ''}€{(profitImpact / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-muted-foreground">
                Net profit change
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}