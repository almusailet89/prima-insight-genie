import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
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
      const response = await fetch('https://cgvdtcmchxkbnsdgbcvz.functions.supabase.co/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportTitle,
          period: selectedPeriod,
          countries: selectedCountries,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Report Generated",
          description: "Your Prima Finance report has been generated successfully.",
        });
        
        // In a full implementation, you would download the actual PowerPoint file
        console.log('Report data:', result.reportData);
        
        // Create a downloadable JSON file for now (in real implementation, this would be a PPTX)
        const dataStr = JSON.stringify(result.reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
      } else {
        throw new Error(result.error || 'Report generation failed');
      }
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
              <SelectItem value="">All periods</SelectItem>
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

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p><strong>Note:</strong> In the current implementation, report data is generated and downloaded as JSON. 
          Full PowerPoint generation requires additional libraries and would be implemented in a production environment.</p>
        </div>
      </CardContent>
    </Card>
  );
}