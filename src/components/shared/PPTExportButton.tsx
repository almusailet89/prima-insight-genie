import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PrimaPPTGenerator, ReportData, SlideData } from '@/lib/ppt-generator';

interface PPTExportButtonProps {
  tab: string;
  data: any;
  period: string;
  companyId: string;
  title: string;
  className?: string;
}

export const PPTExportButton: React.FC<PPTExportButtonProps> = ({
  tab,
  data,
  period,
  companyId,
  title,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPPT = async () => {
    setIsExporting(true);
    try {
      // Mock narrative for now since narratives table may not exist yet
      const narrativeData = {
        summary: `Analysis for ${tab} showing strong performance with key insights and recommendations.`
      };

      // Create slide data based on tab type
      const slides: SlideData[] = [];

      // Title slide
      slides.push({
        type: 'title',
        title: title,
        subtitle: `Prima Assicurazioni - ${new Date().toLocaleDateString()}`
      });

      // Tab-specific slides
      switch (tab) {
        case 'overview':
          slides.push({
            type: 'overview',
            title: 'Key Performance Indicators',
            data: data,
            commentary: narrativeData.summary || 'Performance summary not available'
          });
          break;

        case 'variance':
          slides.push({
            type: 'variance',
            title: 'Variance Analysis',
            data: data,
            commentary: narrativeData.summary || 'Variance analysis not available'
          });
          break;

        case 'sales':
          slides.push({
            type: 'content',
            title: 'Sales Analysis',
            content: data ? JSON.stringify(data, null, 2) : 'No sales data available',
            commentary: narrativeData.summary || 'Sales analysis not available'
          });
          break;

        case 'forecast':
          slides.push({
            type: 'forecast',
            title: 'Forecast Summary',
            data: data,
            commentary: narrativeData.summary || 'Forecast analysis not available'
          });
          break;

        case 'ratios':
          slides.push({
            type: 'content',
            title: 'Financial Ratios',
            content: data ? JSON.stringify(data, null, 2) : 'No ratios data available',
            commentary: narrativeData.summary || 'Ratios analysis not available'
          });
          break;

        case 'scenario':
          slides.push({
            type: 'content',
            title: 'Scenario Analysis',
            content: data ? JSON.stringify(data, null, 2) : 'No scenario data available',
            commentary: narrativeData.summary || 'Scenario analysis not available'
          });
          break;

        default:
          slides.push({
            type: 'content',
            title: 'Analysis',
            content: data ? JSON.stringify(data, null, 2) : 'No data available',
            commentary: narrativeData.summary || 'Analysis not available'
          });
      }

      // Create report data
      const reportData: ReportData = {
        title,
        subtitle: `Prima Assicurazioni - ${tab.charAt(0).toUpperCase() + tab.slice(1)} Report`,
        slides,
        metadata: {
          generatedAt: new Date().toISOString(),
          author: 'Prima Finance Team',
          department: 'Finance'
        }
      };

      // Generate PPT
      const generator = new PrimaPPTGenerator();
      const pptx = generator.generateReport(reportData);
      await generator.downloadPPT(`Prima_${tab}_Report_${new Date().getTime()}.pptx`);

      // For now, just log the export since report_exports table may not exist yet
      console.log('Report exported:', `Prima_${tab}_Report_${new Date().getTime()}.pptx`);

      toast({
        title: "Export Successful",
        description: "PowerPoint report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting to PPT:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PowerPoint report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPPT}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isExporting ? 'Exporting...' : 'Download PPT'}
    </Button>
  );
};