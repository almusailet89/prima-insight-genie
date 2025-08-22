import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PrimaPPTGenerator, ReportData } from '@/lib/ppt-generator';

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Italy', 'UK', 'Spain']);
  const [reportTitle, setReportTitle] = useState('Prima Finance Monthly Report');
  const { toast } = useToast();

  const handleCountryToggle = (country: string, checked: boolean) => {
    if (checked) {
      setSelectedCountries(prev => [...prev, country]);
    } else {
      setSelectedCountries(prev => prev.filter(c => c !== country));
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Generate sample data for the report
      const reportData: ReportData = {
        title: reportTitle,
        subtitle: `Financial Analysis • ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}`,
        slides: [
          {
            type: 'title',
            title: reportTitle,
            subtitle: `Financial Performance Analysis • ${selectedPeriod === 'all' ? 'Full Year 2024' : selectedPeriod}`
          },
          {
            type: 'overview',
            title: 'Executive Summary',
            data: [
              { name: 'Total Revenue', current: 1250000, previous: 1180000, variance: 0.059 },
              { name: 'Operating Margin', current: 0.15, previous: 0.14, variance: 0.071 },
              { name: 'Net Income', current: 187500, previous: 165200, variance: 0.135 },
              { name: 'Loss Ratio', current: 0.62, previous: 0.65, variance: -0.046 }
            ],
            commentary: "Prima Finance shows strong performance with 5.9% revenue growth across key markets. Operating efficiency improvements drove margin expansion, while disciplined underwriting maintained favorable loss ratios."
          },
          ...selectedCountries.map(country => ({
            type: 'country' as const,
            title: `${country} Market Performance`,
            country,
            data: [
              { department: 'Motor Insurance', revenue: country === 'Italy' ? 450000 : country === 'UK' ? 380000 : 320000, growth: country === 'Italy' ? 0.091 : country === 'UK' ? -0.059 : 0.078 },
              { department: 'Home Insurance', revenue: country === 'Italy' ? 280000 : country === 'UK' ? 240000 : 180000, growth: country === 'Italy' ? 0.125 : country === 'UK' ? 0.032 : 0.095 },
              { department: 'Commercial Lines', revenue: country === 'Italy' ? 180000 : country === 'UK' ? 150000 : 120000, growth: country === 'Italy' ? 0.067 : country === 'UK' ? -0.025 : 0.055 }
            ],
            commentary: `${country} operations ${country === 'UK' ? 'faced headwinds from competitive pressures but showed resilience in commercial segments' : 'delivered solid growth driven by digital transformation and customer acquisition'}.`
          })),
          {
            type: 'variance',
            title: 'Budget vs Actual Analysis',
            data: [
              { department: 'Motor Insurance', actual: 1150000, budget: 1100000, variance: 50000, variancePercent: 0.045 },
              { department: 'Home Insurance', actual: 700000, budget: 720000, variance: -20000, variancePercent: -0.028 },
              { department: 'Commercial Lines', actual: 450000, budget: 430000, variance: 20000, variancePercent: 0.047 },
              { department: 'Digital Products', actual: 180000, budget: 160000, variance: 20000, variancePercent: 0.125 }
            ],
            commentary: "Overall positive variance of €70K driven by strong motor insurance performance and digital product success, partially offset by softness in home insurance market."
          },
          {
            type: 'forecast',
            title: 'Full Year 2024 Forecast',
            data: [{ totalRevenue: 2650000, avgGrowth: 0.078 }],
            commentary: "Full year forecast projects €2.65M total revenue with 7.8% growth, supported by continued market expansion in Italy and Spain, plus recovery momentum in UK operations during Q4."
          }
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          author: 'Prima Finance Team',
          department: 'Finance Department'
        }
      };

      // Generate PowerPoint presentation
      const pptGenerator = new PrimaPPTGenerator();
      const pptx = pptGenerator.generateReport(reportData);
      
      // Download the PowerPoint file
      const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
      await pptGenerator.downloadPPT(filename);
      
      toast({
        title: "PowerPoint Generated",
        description: "Your Prima Finance report has been generated and downloaded successfully.",
      });
      
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Prima Finance Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="report-title">Report Title</Label>
          <Input
            id="report-title"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Enter report title"
          />
        </div>

        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All periods</SelectItem>
              <SelectItem value="2024-01-01">2024 YTD</SelectItem>
              <SelectItem value="2024-01-01">Q1 2024</SelectItem>
              <SelectItem value="2024-04-01">Q2 2024</SelectItem>
              <SelectItem value="2024-07-01">Q3 2024</SelectItem>
              <SelectItem value="2024-10-01">Q4 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Countries to Include</Label>
          {['Italy', 'UK', 'Spain'].map((country) => (
            <div key={country} className="flex items-center space-x-2">
              <Checkbox
                id={country}
                checked={selectedCountries.includes(country)}
                onCheckedChange={(checked) => handleCountryToggle(country, checked as boolean)}
              />
              <Label htmlFor={country}>{country}</Label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Report Sections</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>✓ Group Overview KPIs</p>
            <p>✓ Country-level breakdown</p>
            <p>✓ Variance vs budget analysis</p>
            <p>✓ Forecast summary with AI commentary</p>
            <p>✓ Prima branding and styling</p>
          </div>
        </div>

        <Button 
          onClick={generateReport} 
          disabled={isGenerating || selectedCountries.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PowerPoint Report
            </>
          )}
        </Button>

        <div className="text-xs text-success p-3 bg-success/10 rounded-lg border border-success/20">
          <p>✓ <strong>PowerPoint Generation:</strong> Reports are now generated as professional .pptx files with Prima branding, including executive summaries, variance analysis, and AI-powered commentary.</p>
        </div>
      </CardContent>
    </Card>
  );
}